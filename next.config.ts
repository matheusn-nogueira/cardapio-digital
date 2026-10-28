import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Fotos do Storage do Supabase chegam com ~500 KB cada (84 MB no catálogo);
    // o otimizador do Next entrega versões reduzidas no tamanho de cada card.
    remotePatterns: [
      { protocol: 'https', hostname: 'dkbvmqnrdgnhiyhtgsjy.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  // cabeçalhos de segurança (auditoria de 28/10/2026): o cardápio não abre dentro de outro site,
  // o navegador não adivinha tipo de arquivo e só usa HTTPS
  async headers() {
    return [
      {
        source: '/:caminho*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
