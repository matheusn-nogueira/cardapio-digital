-- Notificações push do cardápio (Web Push).
-- Quem aceita as notificações no site vira uma linha aqui. O site (anon) só
-- consegue inscrever e cancelar pelas funções abaixo; ninguém lê a tabela pela
-- API pública. O disparo é feito por scripts/enviar-push.mjs, que lê pela API de
-- gestão do Supabase.

CREATE TABLE IF NOT EXISTS cardapio_push_inscricoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint      text NOT NULL UNIQUE,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  user_agent    text,
  ativo         boolean NOT NULL DEFAULT true,
  -- LGPD: quando a pessoa autorizou (e, se for o caso, quando cancelou)
  autorizado_em timestamptz NOT NULL DEFAULT now(),
  cancelado_em  timestamptz,
  ultimo_envio  timestamptz,
  falhas        integer NOT NULL DEFAULT 0
);

ALTER TABLE cardapio_push_inscricoes ENABLE ROW LEVEL SECURITY;
-- sem políticas: anon e authenticated não leem nem gravam direto

CREATE OR REPLACE FUNCTION cardapio_push_inscrever(p jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_endpoint text := p->>'endpoint';
  v_p256dh   text := p->'keys'->>'p256dh';
  v_auth     text := p->'keys'->>'auth';
BEGIN
  IF v_endpoint IS NULL OR v_endpoint !~ '^https://' OR length(v_endpoint) > 1000
     OR v_p256dh IS NULL OR length(v_p256dh) > 200 OR v_auth IS NULL OR length(v_auth) > 100 THEN
    RAISE EXCEPTION 'INSCRICAO_INVALIDA';
  END IF;
  INSERT INTO cardapio_push_inscricoes (endpoint, p256dh, auth, user_agent)
  VALUES (v_endpoint, v_p256dh, v_auth, left(p->>'user_agent', 300))
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent,
        ativo = true, cancelado_em = NULL, falhas = 0, autorizado_em = now();
END $$;

CREATE OR REPLACE FUNCTION cardapio_push_cancelar(p_endpoint text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE cardapio_push_inscricoes SET ativo = false, cancelado_em = now() WHERE endpoint = p_endpoint;
$$;

REVOKE ALL ON FUNCTION cardapio_push_inscrever(jsonb), cardapio_push_cancelar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cardapio_push_inscrever(jsonb), cardapio_push_cancelar(text) TO anon, authenticated;
