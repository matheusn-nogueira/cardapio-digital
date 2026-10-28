// Dados fixos do site para metadados (Open Graph, manifest, sitemap).
export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cardapio.casadosfundos.cloud').replace(/\/$/, '');

export const DESCRICAO_SITE =
  'Adega com delivery em Realengo: cerveja gelada, destilados, refrigerantes e gelo. Peça pelo cardápio online.';

// Instagram da loja (28/10/2026): convite para postar e marcar, na confirmação, em "Sobre a loja" e no push de entregue
export const INSTAGRAM = 'deliverydosfundos';
export const URL_INSTAGRAM = `https://www.instagram.com/${INSTAGRAM}/`;
