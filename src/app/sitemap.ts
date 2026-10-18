import type { MetadataRoute } from 'next';
import { buscarHome, buscarProdutos, produtosDaCategoria } from '@/lib/cardapio';
import { URL_SITE } from '@/lib/site';

export const revalidate = 3600;

/** Início, categorias com produto e páginas de produto. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();
  const inicio: MetadataRoute.Sitemap = [{ url: `${URL_SITE}/`, lastModified: agora, changeFrequency: 'daily', priority: 1 }];
  try {
    const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
    return [
      ...inicio,
      ...home.categorias
        .filter((c) => produtosDaCategoria(produtos, c).length > 0)
        .map((c) => ({ url: `${URL_SITE}/categoria/${c.id}`, lastModified: agora, changeFrequency: 'daily' as const, priority: 0.8 })),
      ...produtos.map((p) => ({ url: `${URL_SITE}/produto/${p.id}`, lastModified: agora, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ];
  } catch {
    return inicio; // banco fora do ar: pelo menos a home
  }
}
