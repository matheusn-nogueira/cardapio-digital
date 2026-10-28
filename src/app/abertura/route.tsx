import { gerarAbertura } from '@/lib/icone-loja';
import { TELAS_IPHONE } from '@/lib/abertura';

export const revalidate = 86400;

/** Imagem de abertura do iPhone: /abertura?t=1179x2556 (só os tamanhos de TELAS_IPHONE). */
export async function GET(req: Request) {
  const pedida = new URL(req.url).searchParams.get('t') ?? '';
  const tela = TELAS_IPHONE.find((t) => `${t.largura * t.escala}x${t.altura * t.escala}` === pedida);
  if (!tela) return new Response('tamanho desconhecido', { status: 404 });
  return gerarAbertura(tela.largura * tela.escala, tela.altura * tela.escala);
}
