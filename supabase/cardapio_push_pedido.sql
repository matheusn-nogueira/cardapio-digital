-- Aviso de status do pedido por push.
-- Na confirmação, o site liga a inscrição de push do aparelho ao pedido
-- (cardapio_push_vincular_pedido). Quando o ERP muda o status de um pedido do
-- site, o gatilho chama a Edge Function cardapio-push-pedido (pg_net), que manda
-- a notificação. Fica separado do aviso por WhatsApp (erp_aviso_status_pedido).

CREATE TABLE IF NOT EXISTS cardapio_push_pedidos (
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inscricao_id uuid NOT NULL REFERENCES cardapio_push_inscricoes(id) ON DELETE CASCADE,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, inscricao_id)
);
ALTER TABLE cardapio_push_pedidos ENABLE ROW LEVEL SECURITY;

-- O id do pedido é um uuid que só o próprio cliente recebe na confirmação.
CREATE OR REPLACE FUNCTION cardapio_push_vincular_pedido(p_endpoint text, p_pedido uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO cardapio_push_pedidos (order_id, inscricao_id)
  SELECT o.id, i.id
    FROM orders o, cardapio_push_inscricoes i
   WHERE o.id = p_pedido AND o.origin = 'site' AND o.created_at > now() - interval '1 day'
     AND i.endpoint = p_endpoint AND i.ativo
  ON CONFLICT DO NOTHING;
$$;
REVOKE ALL ON FUNCTION cardapio_push_vincular_pedido(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cardapio_push_vincular_pedido(text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION cardapio_push_status_pedido()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_segredo text;
BEGIN
  IF NEW.origin IS DISTINCT FROM 'site' OR NEW.status NOT IN ('em_preparo', 'saiu_entrega', 'entregue', 'cancelado') THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cardapio_push_pedidos WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  SELECT decrypted_secret INTO v_segredo FROM vault.decrypted_secrets WHERE name = 'cardapio_push_webhook';
  IF v_segredo IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    'https://dkbvmqnrdgnhiyhtgsjy.supabase.co/functions/v1/cardapio-push-pedido',
    jsonb_build_object('pedido_id', NEW.id, 'status', NEW.status, 'numero', NEW.daily_number,
                       'retirada', COALESCE(to_jsonb(NEW)->>'retirada', 'false')),
    '{}'::jsonb,
    jsonb_build_object('Content-Type', 'application/json', 'x-segredo', v_segredo),
    5000
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cardapio_push_status ON orders;
CREATE TRIGGER cardapio_push_status AFTER UPDATE OF status ON orders
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION cardapio_push_status_pedido();
