import type { MetadataRoute } from 'next';
import { buscarHome } from '@/lib/cardapio';
import { corSegura } from '@/lib/formatacao';
import { DESCRICAO_SITE } from '@/lib/site';

export const revalidate = 3600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { loja, config } = await buscarHome().catch(() => ({ loja: null, config: null }));

  const nome = loja?.nome || 'Casa dos Fundos';
  return {
    name: nome,
    short_name: nome,
    description: DESCRICAO_SITE,
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: corSegura(config?.cor_primaria, '#F2B705'),
    // /icon é gerado da logo da loja (app/icon.tsx), em tamanho fixo
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
