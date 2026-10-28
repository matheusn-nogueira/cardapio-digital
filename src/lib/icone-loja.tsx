// Ícone do site gerado a partir da logo da loja (Storage do Supabase), para
// favicon, ícone do iPhone e manifest. Se a logo não carregar, sai um "CF" na
// cor da loja — o build nunca quebra por causa da imagem.
import { ImageResponse } from 'next/og';
import { buscarHome } from './cardapio';
import { corSegura } from './formatacao';

export async function logoComoDataUrl(url: string | null): Promise<string | null> {
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
  const margem = Math.round(lado * 0.1);
  return new ImageResponse(
    logo ? (
      // Freezer (27/10/2026): logo sobre o azul-noite, igual ao topo e à abertura do app (antes, fundo branco)
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A2540' }}>
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

/**
 * Tela de abertura do app instalado (27/10/2026): azul-noite com a logo no meio, no lugar da tela
 * branca. O Android monta a dele com o fundo e o ícone do manifest; o iPhone só mostra imagem
 * pronta do tamanho exato da tela (apple-touch-startup-image), gerada aqui. Sem logo, só o azul.
 */
export async function gerarAbertura(largura: number, altura: number): Promise<ImageResponse> {
  const home = await buscarHome().catch(() => null);
  const logo = await logoComoDataUrl(home?.loja.logo_url ?? null);
  const lado = Math.round(largura * 0.36);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A2540' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="" width={lado} height={lado} style={{ objectFit: 'contain' }} />}
      </div>
    ),
    { width: largura, height: altura },
  );
}
