-- Inscrição de push só para os serviços de push de verdade (auditoria de segurança de 28/10/2026,
-- achado S-C06). Antes aceitava qualquer https://: um anônimo inscrevia endereços próprios ou da
-- rede local e, a cada campanha (scripts/enviar-push.mjs no Mac do dono), recebia o IP de casa e
-- os avisos. Google (Chrome/Android), Mozilla, Apple e Microsoft. Gerado da definição em produção.
BEGIN;
CREATE OR REPLACE FUNCTION public.cardapio_push_inscrever(p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_endpoint text := p->>'endpoint';
  v_p256dh   text := p->'keys'->>'p256dh';
  v_auth     text := p->'keys'->>'auth';
BEGIN
  IF v_endpoint IS NULL OR v_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/' OR length(v_endpoint) > 1000
     OR v_p256dh IS NULL OR length(v_p256dh) > 200 OR v_auth IS NULL OR length(v_auth) > 100 THEN
    RAISE EXCEPTION 'INSCRICAO_INVALIDA';
  END IF;
  INSERT INTO cardapio_push_inscricoes (endpoint, p256dh, auth, user_agent)
  VALUES (v_endpoint, v_p256dh, v_auth, left(p->>'user_agent', 300))
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent,
        ativo = true, cancelado_em = NULL, falhas = 0, autorizado_em = now();
END $function$;
COMMIT;
