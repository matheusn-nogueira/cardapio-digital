import { cabecalhosSupabase, urlRest } from '@/lib/supabase';

// Usado pelo service worker quando o navegador troca a inscrição de push sozinho
// (pushsubscriptionchange): o SW não tem as chaves do Supabase, então passa por aqui.
// Mesma validação do banco (cardapio_push_inscrever); aqui só repassa.
export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return new Response('json inválido', { status: 400 });
  }
  const r = await fetch(urlRest('rpc/cardapio_push_inscrever'), {
    method: 'POST',
    headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p: corpo }),
  });
  return new Response(null, { status: r.ok ? 204 : 400 });
}
