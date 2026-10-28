import type { MetadataRoute } from 'next';
import { buscarHome } from '@/lib/cardapio';
import { DESCRICAO_SITE } from '@/lib/site';

export const revalidate = 3600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { loja } = await buscarHome().catch(() => ({ loja: null }));

  const nome = loja?.nome || 'Casa dos Fundos';
  return {
    name: nome,
    short_name: nome,
    description: DESCRICAO_SITE,
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // abertura do app no Android: fundo azul-noite com o ícone (Freezer), não a tela branca
    background_color: '#0A2540',
    theme_color: '#0A2540',
    // /icon é gerado da logo da loja (app/icon.tsx), em tamanho fixo
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
