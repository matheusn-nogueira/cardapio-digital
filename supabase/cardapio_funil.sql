-- Números do site para o dono (27/10/2026): até onde as pessoas chegam no pedido e o que
-- elas buscam. A tela é "Site" no ERP (só a conta do dono), que lê por erp_site_resumo.
-- Aplicar: python3 -I scripts/sql-supabase.py supabase/cardapio_funil.sql
--
-- Etapas: cada aba do navegador é uma "sessão" (uuid sorteado no aparelho, sem nome,
-- telefone nem IP). Grava uma linha por (sessão, etapa), a primeira vez que chega nela:
--   visita → sacola (abriu a sacola com item) → dados (nome e WhatsApp) → endereco
--   → pagamento (confirmação) → pedido (pedido aceito pelo banco).
-- Quem já pediu pula etapas (vai direto à confirmação): a conta é "chegou até", não "passou por".

CREATE TABLE IF NOT EXISTS public.cardapio_funil (
  sessao     uuid        NOT NULL,
  etapa      text        NOT NULL CHECK (etapa IN ('visita', 'sacola', 'dados', 'endereco', 'pagamento', 'pedido')),
  -- o aparelho já tinha nome e WhatsApp salvos de um pedido anterior
  recorrente boolean     NOT NULL DEFAULT false,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sessao, etapa)
);
CREATE INDEX IF NOT EXISTS cardapio_funil_criado_em ON public.cardapio_funil (criado_em);

-- Buscas feitas no site (uma vez por termo em cada sessão), com quantos produtos acharam.
-- Busca sem resultado é apelido que falta no cadastro do produto.
CREATE TABLE IF NOT EXISTS public.cardapio_buscas (
  id         bigserial   PRIMARY KEY,
  termo      text        NOT NULL,
  resultados integer     NOT NULL,
  -- achou só com erro de digitação corrigido ou ignorando palavras
  aproximado boolean     NOT NULL DEFAULT false,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cardapio_buscas_criado_em ON public.cardapio_buscas (criado_em);

-- ninguém lê nem grava direto: o site grava pelas funções abaixo, o ERP lê pela erp_site_resumo
ALTER TABLE public.cardapio_funil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio_buscas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cardapio_funil, public.cardapio_buscas FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.cardapio_buscas_id_seq FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.cardapio_funil_registrar(p_sessao uuid, p_etapa text, p_recorrente boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_sessao IS NULL OR p_etapa IS NULL
     OR p_etapa NOT IN ('visita', 'sacola', 'dados', 'endereco', 'pagamento', 'pedido') THEN
    RETURN;
  END IF;
  INSERT INTO cardapio_funil (sessao, etapa, recorrente)
  VALUES (p_sessao, p_etapa, COALESCE(p_recorrente, false))
  ON CONFLICT DO NOTHING;
  -- limpeza de vez em quando: guarda 6 meses
  IF random() < 0.01 THEN
    DELETE FROM cardapio_funil WHERE criado_em < now() - interval '180 days';
    DELETE FROM cardapio_buscas WHERE criado_em < now() - interval '180 days';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cardapio_busca_registrar(p_termo text, p_resultados integer, p_aproximado boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_termo text := lower(btrim(regexp_replace(COALESCE(p_termo, ''), '\s+', ' ', 'g')));
BEGIN
  IF length(v_termo) < 2 OR length(v_termo) > 60 OR p_resultados IS NULL OR p_resultados < 0 THEN
    RETURN;
  END IF;
  INSERT INTO cardapio_buscas (termo, resultados, aproximado)
  VALUES (v_termo, LEAST(p_resultados, 9999), COALESCE(p_aproximado, false));
END $$;

REVOKE ALL ON FUNCTION public.cardapio_funil_registrar(uuid, text, boolean) FROM public;
REVOKE ALL ON FUNCTION public.cardapio_busca_registrar(text, integer, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.cardapio_funil_registrar(uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cardapio_busca_registrar(text, integer, boolean) TO anon, authenticated;

-- primeira versão (27/10, minutos antes): trocada pela erp_site_resumo
DROP FUNCTION IF EXISTS public.erp_cardapio_funil(integer);

-- Tudo da tela "Site" do ERP num JSON, para os últimos p_dias (1 a 180), em horário de Brasília.
-- Só a conta do dono (exigir_dono).
CREATE OR REPLACE FUNCTION public.erp_site_resumo(p_dias integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dias   integer := LEAST(GREATEST(COALESCE(p_dias, 7), 1), 180);
  v_inicio date := (now() AT TIME ZONE 'America/Sao_Paulo')::date - (v_dias - 1);
  v_desde  timestamptz := (v_inicio::timestamp AT TIME ZONE 'America/Sao_Paulo');
  v_res    jsonb;
BEGIN
  PERFORM exigir_dono();

  WITH por_sessao AS (
    SELECT sessao,
           (min(criado_em) AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
           bool_or(recorrente) AS recorrente,
           max(CASE etapa WHEN 'visita' THEN 1 WHEN 'sacola' THEN 2 WHEN 'dados' THEN 3
                          WHEN 'endereco' THEN 4 WHEN 'pagamento' THEN 5 WHEN 'pedido' THEN 6 END) AS ate
      FROM cardapio_funil
     WHERE criado_em >= v_desde - interval '1 day'
     GROUP BY sessao
  ), sessoes AS (
    SELECT * FROM por_sessao WHERE dia >= v_inicio
  ), pedidos AS (
    SELECT o.*,
           NOT EXISTS (SELECT 1 FROM orders a
                        WHERE a.customer_id = o.customer_id AND a.origin = 'site'
                          AND NOT COALESCE(a.teste, false) AND a.status <> 'cancelado'
                          AND a.created_at < o.created_at) AS primeiro
      FROM orders o
     WHERE o.origin = 'site' AND NOT COALESCE(o.teste, false) AND o.created_at >= v_desde
  )
  SELECT jsonb_build_object(
    'dias', v_dias,
    'funil', (
      SELECT jsonb_object_agg(grupo, contagem) FROM (
        SELECT g.grupo,
               jsonb_build_object(
                 'visita',    count(*) FILTER (WHERE s.ate >= 1),
                 'sacola',    count(*) FILTER (WHERE s.ate >= 2),
                 'dados',     count(*) FILTER (WHERE s.ate >= 3),
                 'endereco',  count(*) FILTER (WHERE s.ate >= 4),
                 'pagamento', count(*) FILTER (WHERE s.ate >= 5),
                 'pedido',    count(*) FILTER (WHERE s.ate >= 6)) AS contagem
          FROM (VALUES ('todos'), ('novos'), ('recorrentes')) g(grupo)
          LEFT JOIN sessoes s
            ON g.grupo = 'todos' OR (g.grupo = 'novos' AND NOT s.recorrente) OR (g.grupo = 'recorrentes' AND s.recorrente)
         GROUP BY g.grupo
      ) x
    ),
    'por_dia', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'dia', d.dia,
               'visitas', (SELECT count(*) FROM sessoes s WHERE s.dia = d.dia),
               'sacolas', (SELECT count(*) FROM sessoes s WHERE s.dia = d.dia AND s.ate >= 2),
               'pedidos', (SELECT count(*) FROM pedidos p WHERE p.status <> 'cancelado'
                             AND (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d.dia),
               'faturamento', (SELECT COALESCE(sum(p.total), 0) FROM pedidos p WHERE p.status <> 'cancelado'
                                 AND (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d.dia))
             ORDER BY d.dia DESC)
        FROM (SELECT generate_series(v_inicio, (now() AT TIME ZONE 'America/Sao_Paulo')::date, interval '1 day')::date AS dia) d
    ), '[]'::jsonb),
    'pedidos', (
      SELECT jsonb_build_object(
               'quantidade',  count(*) FILTER (WHERE status <> 'cancelado'),
               'cancelados',  count(*) FILTER (WHERE status = 'cancelado'),
               'faturamento', COALESCE(sum(total) FILTER (WHERE status <> 'cancelado'), 0),
               'retirada',    count(*) FILTER (WHERE status <> 'cancelado' AND COALESCE(retirada, false)),
               'clientes_novos', count(*) FILTER (WHERE status <> 'cancelado' AND primeiro),
               'pix',      count(*) FILTER (WHERE status <> 'cancelado' AND payment_method = 'pix'),
               'dinheiro', count(*) FILTER (WHERE status <> 'cancelado' AND payment_method = 'dinheiro'),
               'cartao',   count(*) FILTER (WHERE status <> 'cancelado' AND payment_method NOT IN ('pix', 'dinheiro')))
        FROM pedidos
    ),
    'buscas_sem_resultado', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('termo', termo, 'vezes', vezes) ORDER BY vezes DESC, termo)
        FROM (SELECT termo, count(*) AS vezes FROM cardapio_buscas
               WHERE criado_em >= v_desde AND resultados = 0
               GROUP BY termo ORDER BY count(*) DESC, termo LIMIT 20) b
    ), '[]'::jsonb),
    'buscas_mais_feitas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('termo', termo, 'vezes', vezes, 'aproximado', aproximado) ORDER BY vezes DESC, termo)
        FROM (SELECT termo, count(*) AS vezes, bool_or(aproximado) AS aproximado FROM cardapio_buscas
               WHERE criado_em >= v_desde AND resultados > 0
               GROUP BY termo ORDER BY count(*) DESC, termo LIMIT 20) b
    ), '[]'::jsonb),
    'buscas_total', (SELECT count(*) FROM cardapio_buscas WHERE criado_em >= v_desde)
  ) INTO v_res;
  RETURN v_res;
END $$;

REVOKE ALL ON FUNCTION public.erp_site_resumo(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.erp_site_resumo(integer) TO authenticated;
