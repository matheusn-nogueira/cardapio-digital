// Prévia do link nas conversas (28/10/2026, divulgação): a imagem que o WhatsApp, o Instagram e o
// Telegram mostram quando alguém manda o cardápio ou um produto. 1200×630, nas cores Freezer.
// Cardápio: logo, chamada e três latas. Produto: foto, nome e preço (e a promoção, se houver).
// Fonte e imagens que não carregarem não quebram a prévia: sai com a fonte padrão ou sem a figura.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { buscarHome } from './cardapio';
import { formatarPreco } from './formatacao';
import { logoComoDataUrl } from './icone-loja';
import { blocoEmDestaque, melhorPreco } from './precoQuantidade';
import type { Produto } from './tipos';

export const TAMANHO_PREVIA = { width: 1200, height: 630 };

const TINTA = '#0A2540';
const BANNER = '#0F3A63';
const PRIMARIA = '#FFD200';
const TOPO_TEXTO = '#A9C3DA';

const FONTES_CSS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@500;600';

/** Barlow e Barlow Condensed em ttf (o Google entrega ttf quando o pedido não diz o navegador). */
async function fontes() {
  try {
    const css = await (await fetch(FONTES_CSS, { signal: AbortSignal.timeout(8000) })).text();
    const blocos = [...css.matchAll(/font-family: '([^']+)';[^}]*?font-weight: (\d+);[^}]*?url\((https:[^)]+\.ttf)\)/g)];
    return await Promise.all(
      blocos.map(async ([, nome, peso, url]) => ({
        name: nome,
        weight: Number(peso) as 500 | 600 | 700 | 800,
        style: 'normal' as const,
        data: await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer(),
      })),
    );
  } catch {
    return [];
  }
}

async function lataComoDataUrl(arquivo: string): Promise<string | null> {
  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', 'banners', 'latas', arquivo));
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Foto do produto em PNG: as fotos do catálogo são webp, que o gerador da prévia não lê. */
async function fotoComoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const png = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(840, 1000, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

const LATAS_DO_CARDAPIO = ['heineken_latao_473ml.png', 'imperio_latao_473ml.png', 'brahma_lata_350ml.png'];

export async function gerarPreviaCardapio(): Promise<ImageResponse> {
  const home = await buscarHome().catch(() => null);
  const [logo, fonte, ...latas] = await Promise.all([
    logoComoDataUrl(home?.loja.logo_url ?? null),
    fontes(),
    ...LATAS_DO_CARDAPIO.map(lataComoDataUrl),
  ]);
  const nome = home?.loja.nome || 'Casa dos Fundos';
  const local = home?.loja.bairro || 'Realengo';
  const entrega = home ? `Entrega em ${home.config.tempo_entrega_min}–${home.config.tempo_entrega_max} min · ${local}` : local;
  // leque: a do meio na frente e mais alta, as de fora inclinadas para trás
  const leque = [
    { left: 20, top: 120, altura: 340, giro: -12 },
    { left: 250, top: 110, altura: 340, giro: 12 },
    { left: 120, top: 70, altura: 400, giro: 0 },
  ];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: TINTA, fontFamily: 'Barlow' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 72px', width: 700 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="" width={120} height={120} style={{ objectFit: 'contain', marginBottom: 28 }} />}
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 92, lineHeight: 1, color: 'white', textTransform: 'uppercase' }}>
            {nome}
          </div>
          <div style={{ fontSize: 36, fontWeight: 500, color: TOPO_TEXTO, marginTop: 18 }}>Cerveja gelada, destilados e gelo</div>
          <div style={{ fontSize: 30, fontWeight: 500, color: TOPO_TEXTO, marginTop: 6 }}>{entrega}</div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              marginTop: 36,
              padding: '16px 32px',
              borderRadius: 18,
              background: PRIMARIA,
              color: TINTA,
              fontFamily: 'Barlow Condensed',
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Peça pelo cardápio
          </div>
        </div>
        <div style={{ display: 'flex', position: 'relative', width: 500, height: 630 }}>
          <div style={{ position: 'absolute', left: 0, top: 95, width: 440, height: 440, borderRadius: 220, background: BANNER }} />
          {leque.map((l, i) =>
            latas[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={latas[i]!}
                alt=""
                height={l.altura}
                style={{ position: 'absolute', left: l.left, top: l.top, height: l.altura, transform: `rotate(${l.giro}deg)` }}
              />
            ) : null,
          )}
        </div>
      </div>
    ),
    { ...TAMANHO_PREVIA, fonts: fonte.length ? fonte : undefined },
  );
}

export async function gerarPreviaProduto(produto: Produto | undefined): Promise<ImageResponse> {
  if (!produto) return gerarPreviaCardapio();
  const home = await buscarHome().catch(() => null);
  const [logo, foto, fonte] = await Promise.all([
    logoComoDataUrl(home?.loja.logo_url ?? null),
    fotoComoDataUrl(produto.imagem_url),
    fontes(),
  ]);
  const nome = home?.loja.nome || 'Casa dos Fundos';
  const unidade = melhorPreco(produto, 1, false).total;
  const bloco = blocoEmDestaque(produto);
  const promo = bloco?.desconto ? `${bloco.qtd} por ${formatarPreco(bloco.preco)}` : null;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: TINTA, fontFamily: 'Barlow' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 520, height: 630, background: 'white' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {foto && <img src={foto} alt="" width={460} height={560} style={{ objectFit: 'contain' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px', width: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo && <img src={logo} alt="" width={64} height={64} style={{ objectFit: 'contain' }} />}
            <div style={{ fontSize: 30, fontWeight: 600, color: TOPO_TEXTO }}>{nome}</div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.15, color: 'white', display: 'flex', maxHeight: 175, overflow: 'hidden' }}>
            {produto.nome}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 104, lineHeight: 1, color: PRIMARIA, marginTop: 24 }}>
            {formatarPreco(unidade)}
          </div>
          {promo && (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                marginTop: 20,
                padding: '10px 22px',
                borderRadius: 14,
                background: BANNER,
                color: 'white',
                fontFamily: 'Barlow Condensed',
                fontWeight: 700,
                fontSize: 36,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {promo}
            </div>
          )}
        </div>
      </div>
    ),
    { ...TAMANHO_PREVIA, fonts: fonte.length ? fonte : undefined },
  );
}
