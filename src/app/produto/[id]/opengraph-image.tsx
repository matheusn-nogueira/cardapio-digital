import { buscarProdutos } from '@/lib/cardapio';
import { gerarPreviaProduto, TAMANHO_PREVIA } from '@/lib/previa-link';

// Prévia do link de um produto: foto, nome e preço (src/lib/previa-link.tsx).
export const size = TAMANHO_PREVIA;
export const contentType = 'image/png';
export const alt = 'Produto da Casa dos Fundos';
export const revalidate = 3600;

export default async function PreviaProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return gerarPreviaProduto((await buscarProdutos()).find((p) => p.id === id));
}
