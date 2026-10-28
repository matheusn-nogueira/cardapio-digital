// Edge Function: manda o push de status do pedido para os aparelhos ligados a ele.
// Chamada só pelo gatilho cardapio_push_status_pedido (pg_net), com o segredo
// compartilhado no cabeçalho x-segredo. Ver supabase/cardapio_push_pedido.sql.
import webpush from 'npm:web-push@3.6.7';

const URL_BASE = Deno.env.get('SUPABASE_URL')!;
const CHAVE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SEGREDO = Deno.env.get('CARDAPIO_PUSH_WEBHOOK');

webpush.setVapidDetails(
  'https://cardapio.casadosfundos.cloud',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

function mensagem(status: string, numero: number, retirada: boolean): { title: string; body: string } | null {
  switch (status) {
    case 'em_preparo':
      return { title: `Pedido #${numero} em preparo`, body: 'Já estamos separando suas bebidas, geladinhas.' };
    case 'saiu_entrega':
      return retirada
        ? { title: `Pedido #${numero} pronto para retirada`, body: 'Pode vir buscar: está tudo separado.' }
        : { title: `Pedido #${numero} saiu para entrega`, body: 'Fique de olho na campainha, já já chega.' };
    case 'entregue':
      // divulgação (28/10/2026): a hora do brinde é a hora da foto
      return { title: `Pedido #${numero} entregue`, body: 'Bom proveito! Poste o brinde e marque @deliverydosfundos.' };
    case 'cancelado':
      return { title: `Pedido #${numero} cancelado`, body: 'Se tiver dúvida, fale com a gente no WhatsApp.' };
    default:
      return null;
  }
}

async function rest(caminho: string, init: RequestInit = {}) {
  return fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...init,
    headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}`, 'Content-Type': 'application/json', ...init.headers },
  });
}

Deno.serve(async (req) => {
  if (!SEGREDO || req.headers.get('x-segredo') !== SEGREDO) return new Response('proibido', { status: 403 });
  const { pedido_id, status, numero, retirada } = await req.json();
  const msg = mensagem(String(status), Number(numero), String(retirada) === 'true');
  if (!msg || !/^[0-9a-f-]{36}$/i.test(String(pedido_id))) return new Response('ignorado', { status: 200 });

  const r = await rest(
    `cardapio_push_pedidos?order_id=eq.${pedido_id}&select=inscricao:cardapio_push_inscricoes(id,endpoint,p256dh,auth,ativo)`,
  );
  const linhas = (await r.json()) as { inscricao: { id: string; endpoint: string; p256dh: string; auth: string; ativo: boolean } }[];
  const corpo = JSON.stringify({ ...msg, url: '/confirmation' });
  let enviados = 0;
  for (const { inscricao: i } of linhas) {
    if (!i?.ativo) continue;
    try {
      await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, corpo, {
        TTL: 60 * 60,
        urgency: 'high',
      });
      enviados++;
    } catch (e) {
      const codigo = (e as { statusCode?: number }).statusCode;
      if (codigo === 404 || codigo === 410) {
        await rest(`cardapio_push_inscricoes?id=eq.${i.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ativo: false, cancelado_em: new Date().toISOString() }),
        });
      }
    }
  }
  return new Response(JSON.stringify({ enviados }), { headers: { 'Content-Type': 'application/json' } });
});
