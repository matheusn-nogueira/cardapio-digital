-- Andamento do pedido na tela de confirmação do site (26/10/2026).
-- A chave anon não lê orders (supabase_login_papeis.sql); esta função devolve só o status
-- de UM pedido do site, pelo id (uuid, impossível de adivinhar), e só nas primeiras 24 h.
-- Nada de nome, endereço ou itens.
-- Aplicar: python3 -I scripts/sql-supabase.py supabase/cardapio_status_pedido.sql
CREATE OR REPLACE FUNCTION public.cardapio_status_pedido(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('status', o.status, 'retirada', COALESCE(o.retirada, false), 'atualizado_em', o.updated_at)
    FROM orders o
   WHERE o.id = p_id AND o.origin = 'site' AND o.created_at > now() - interval '24 hours';
$$;

REVOKE ALL ON FUNCTION public.cardapio_status_pedido(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cardapio_status_pedido(uuid) TO anon, authenticated;
