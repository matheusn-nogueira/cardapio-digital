import { ImageResponse } from 'next/og';

// Ícone pequeno da notificação (badge). O Android usa só a silhueta (canal alfa),
// então é um sino branco em fundo transparente; o logo colorido vira um quadrado.
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" fill="#FFFFFF" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
    ),
    { width: 96, height: 96 },
  );
}
