-- Esgotados no cardápio online (27/10/2026, pedido do dono): produto pausado no ERP aparece
-- apagado, com "Volta logo", no fim da categoria e da busca, em vez de sumir.
--
-- View separada: a cardapio_vw_produtos (o que está à venda) fica como está, então nenhum pedido
-- passa a aceitar produto pausado. Mesmas colunas dela, para o site normalizar igual.
-- Só pausados há até 30 dias: depois disso o produto deixou de ser "volta logo" e some.
-- Idempotente. Aplicar com: python3 -I scripts/sql-supabase.py supabase/cardapio_esgotados.sql

CREATE OR REPLACE VIEW public.cardapio_vw_esgotados AS
SELECT p.id,
    COALESCE(NULLIF(cp.nome_exibicao, ''::text), btrim(regexp_replace(p.name, '^\s*\[quente\]\s*'::text, ''::text, 'i'::text))) AS nome,
    p.name AS nome_original,
    p.category AS categoria,
    p.system_category AS marca,
    COALESCE(NULLIF(cp.descricao, ''::text), p.description) AS descricao,
    COALESCE(NULLIF(cp.imagem_url, ''::text), p.image_url) AS imagem_url,
    p.price AS preco,
    COALESCE(p.price_card, p.price) AS preco_cartao,
    p.retornavel,
    COALESCE(cp.gelada, p.name !~* '^\s*\[quente\]'::text) AS gelada,
    COALESCE(cp.destaque, false) AS destaque,
    cp.selo,
    COALESCE(cp.ordem, 9999) AS ordem,
    0::numeric AS vendas_recentes,
    ( SELECT jsonb_agg(jsonb_build_object('id', o.id, 'nome', btrim(regexp_replace(o.nome, '^\s*\[quente\]\s*'::text, ''::text, 'i'::text)), 'quente', o.nome ~* '^\s*\[quente\]'::text, 'qtd', o.qtd_minima, 'preco', o.preco_dinheiro, 'preco_cartao', COALESCE(o.preco_cartao, o.preco_dinheiro)) ORDER BY o.qtd_minima, o.preco_dinheiro)
           FROM ofertas o
          WHERE o.product_id = p.id AND o.ativo AND o.disponivel_online AND o.preco_dinheiro > 0::numeric) AS ofertas,
    COALESCE(p.aliases, '{}'::text[]) || COALESCE(p.tags, '{}'::text[]) AS apelidos
   FROM products p
     LEFT JOIN cardapio_produtos cp ON cp.product_id = p.id
  WHERE p.active
    AND p.pausado_em IS NOT NULL
    AND p.pausado_em > now() - interval '30 days'
    AND COALESCE(p.available_online, true)
    AND NOT COALESCE(cp.oculto, false)
    AND COALESCE(NULLIF(cp.imagem_url, ''::text), p.image_url) IS NOT NULL
    AND EXISTS ( SELECT 1 FROM ofertas o
          WHERE o.product_id = p.id AND o.ativo AND o.disponivel_online AND o.preco_dinheiro > 0::numeric);

-- a chave pública (anon) está fechada desde 26/10: a view nova precisa do GRANT explícito
REVOKE ALL ON public.cardapio_vw_esgotados FROM anon, authenticated;
GRANT SELECT ON public.cardapio_vw_esgotados TO anon, authenticated;
