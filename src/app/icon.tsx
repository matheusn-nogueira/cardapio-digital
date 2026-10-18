import { gerarIconeLoja } from '@/lib/icone-loja';

// Favicon gerado da logo da loja (substitui o favicon padrão do Next).
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';
export const revalidate = 86400;

export default function Icon() {
  return gerarIconeLoja(size.width);
}
