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
};

export default nextConfig;
