// Ícone do site gerado a partir da logo da loja (Storage do Supabase), para
// favicon, ícone do iPhone e manifest. Se a logo não carregar, sai um "CF" na
// cor da loja — o build nunca quebra por causa da imagem.
import { ImageResponse } from 'next/og';
import { buscarHome } from './cardapio';
import { corSegura } from './formatacao';

async function logoComoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
    const tipo = r.headers.get('content-type') ?? '';
    if (!r.ok || !tipo.startsWith('image/') || tipo.includes('svg')) return null;
    const bytes = Buffer.from(await r.arrayBuffer());
    return `data:${tipo};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function gerarIconeLoja(lado: number): Promise<ImageResponse> {
  const home = await buscarHome().catch(() => null);
  const cor = corSegura(home?.config.cor_primaria, '#F2B705');
  const logo = await logoComoDataUrl(home?.loja.logo_url ?? null);
  const margem = Math.round(lado * 0.08);
  return new ImageResponse(
    logo ? (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={lado - margem * 2} height={lado - margem * 2} style={{ objectFit: 'contain' }} />
      </div>
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: cor,
          color: '#1A1A1A',
          fontSize: Math.round(lado * 0.45),
          fontWeight: 700,
          borderRadius: Math.round(lado * 0.18),
        }}
      >
        CF
      </div>
    ),
    { width: lado, height: lado },
  );
}
