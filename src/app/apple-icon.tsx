import { gerarIconeLoja } from '@/lib/icone-loja';

// Ícone da tela inicial do iPhone, gerado da logo da loja.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const revalidate = 86400;

export default function AppleIcon() {
  return gerarIconeLoja(size.width);
}
