import { gerarPreviaCardapio, TAMANHO_PREVIA } from '@/lib/previa-link';

// Prévia do link do cardápio no WhatsApp e nas redes (src/lib/previa-link.tsx).
export const size = TAMANHO_PREVIA;
export const contentType = 'image/png';
export const alt = 'Casa dos Fundos: cerveja gelada, destilados e gelo com entrega';
export const revalidate = 86400;

export default function PreviaCardapio() {
  return gerarPreviaCardapio();
}
