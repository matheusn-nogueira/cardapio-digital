'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import recortes from '@/data/recortes.json';
import { useCardapio } from '@/context/CardapioContext';
import { corSegura, normalizarTexto, urlExternaSegura } from '@/lib/formatacao';
import { ofertaPromocional } from '@/lib/ofertas';
import type { Banner, Produto } from '@/lib/tipos';
import { SlideApp, useModoBannerApp } from './BannerApp';

const RECORTES = recortes as Record<string, string>;

function destinoBanner(b: Banner): { href: string; externo: boolean } | null {
  const valor = b.link_valor?.trim();
  if (!valor) return null;
  if (b.link_tipo === 'categoria') return { href: `/categoria/${encodeURIComponent(valor)}`, externo: false };
  if (b.link_tipo === 'produto') return { href: `/produto/${encodeURIComponent(valor)}`, externo: false };
  if (b.link_tipo === 'url') {
    if (valor.startsWith('/')) return { href: valor, externo: false };
    const url = urlExternaSegura(valor);
    return url ? { href: url, externo: true } : null;
  }
  return null;
}

/** Recorte transparente da foto do produto (scripts/recortar-latas.py), se existir. */
function recorteDe(p: Produto): string | null {
  const base = p.imagem_url?.split('?')[0].split('/').pop()?.replace(/\.[a-z0-9]+$/i, '');
  return base && RECORTES[base] ? `/banners/latas/${RECORTES[base]}` : null;
}

/** "Império Latão: 3 por R$ 11,00" → nome "Império Latão", chamada "3 por", preço "R$ 11,00". */
function partesDoTitulo(titulo: string): { nome: string; chamada: string; preco: string | null } {
  const i = titulo.indexOf(':');
  const nome = (i >= 0 ? titulo.slice(0, i) : titulo).trim();
  const oferta = i >= 0 ? titulo.slice(i + 1).trim() : '';
  const m = oferta.match(/^(.*?)\s*(R\$\s*[\d.,]+)\s*$/);
  return { nome, chamada: m ? m[1] : oferta, preco: m ? m[2] : null };
}

/**
 * Latas que ilustram o banner, só as que têm recorte: o produto do link; senão os que têm
 * todas as palavras do nome do título (os em promoção primeiro: "Império Latão" é a Pilsen
 * branca da promoção, não a Lager verde); senão as promoções da loja. "3 por" repete a lata 3×.
 */
function latasDoBanner(banner: Banner, nome: string, chamada: string, produtos: Produto[]): string[] {
  const comRecorte = (lista: Produto[]) => lista.map(recorteDe).filter((u): u is string => !!u);
  const emPromo = (p: Produto) => p.ofertas.some(ofertaPromocional);
  let latas: string[] = [];
  if (banner.link_tipo === 'produto') latas = comRecorte(produtos.filter((p) => p.id === banner.link_valor));
  if (!latas.length && nome) {
    const palavras = normalizarTexto(nome).split(/\s+/).filter(Boolean);
    const casam = produtos.filter((p) => palavras.every((w) => normalizarTexto(p.nome).includes(w)));
    latas = comRecorte([...casam.filter(emPromo), ...casam.filter((p) => !emPromo(p))]).slice(0, 1);
  }
  if (latas.length === 1) {
    const vezes = Number(chamada.match(/^(\d+)\s*(por|x)\b/i)?.[1] ?? 1);
    return Array.from({ length: Math.min(Math.max(vezes, 1), 3) }, () => latas[0]);
  }
  return latas.length ? latas : [...new Set(comRecorte(produtos.filter(emPromo)))].slice(0, 3);
}

// Posição das latas em leque (como nos banners do Zé): a do meio na frente e maior.
const LEQUE: Record<number, { left: string; rotate: number; escala: number; z: number }[]> = {
  1: [{ left: '50%', rotate: 6, escala: 1, z: 2 }],
  2: [
    { left: '36%', rotate: -8, escala: 0.92, z: 1 },
    { left: '64%', rotate: 8, escala: 1, z: 2 },
  ],
  3: [
    { left: '30%', rotate: -10, escala: 0.84, z: 1 },
    { left: '70%', rotate: 10, escala: 0.84, z: 1 },
    { left: '50%', rotate: 0, escala: 1, z: 2 },
  ],
};

/** Botão amarelo no canto de baixo, dentro do banner (dono, 28/10/2026). */
export const BotaoBanner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="absolute left-4 bottom-4 z-20 inline-flex items-center h-10 px-5 rounded-xl bg-primaria text-primaria-texto font-condensed font-bold uppercase text-[15px] tracking-[0.05em] shadow-[0_4px_10px_rgb(0_0_0/0.25)]">
    {children}
  </span>
);

// Banner sem foto vira arte no estilo do Zé (28/10/2026, dono: "estão muito ruins"): fundo azul
// com um brilho gelado atrás das latas recortadas em leque, nome e preço grandes em letra
// condensada e o botão amarelo no canto de baixo (sem selo de moderação: dono, 28/10/2026).
// Com foto, vale a foto.
const ConteudoBanner: React.FC<{ banner: Banner; primeiro: boolean; comLink: boolean }> = ({ banner, primeiro, comLink }) => {
  const { produtos } = useCardapio();
  const rotulo = banner.link_tipo === 'categoria' ? 'Ver promoções' : banner.link_tipo === 'produto' ? 'Ver produto' : 'Saiba mais';

  if (banner.imagem_url) {
    return (
      <div className="relative w-full min-h-44 rounded-2xl overflow-hidden" style={{ background: corSegura(banner.cor_fundo, '#0F3A63') }}>
        <Image src={banner.imagem_url} alt={banner.titulo ?? ''} fill priority={primeiro} sizes="(max-width: 640px) 100vw, 640px" quality={75} className="object-cover" />
      </div>
    );
  }

  const { nome, chamada, preco } = partesDoTitulo(banner.titulo ?? '');
  const latas = latasDoBanner(banner, nome, chamada, produtos);
  const leque = LEQUE[latas.length] ?? [];
  // com latas, o banner é para bater o olho (como no Zé): sem texto corrido. Sem latas, a
  // primeira frase do subtítulo
  const apoio = latas.length ? null : banner.subtitulo?.split(/(?<=\.)\s/)[0];

  return (
    <div className="relative w-full min-h-44 rounded-2xl bg-banner">
      <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
        <span
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-topo-texto) 55%, transparent) 0%, transparent 68%)' }}
        />
        {latas.length > 0 && (
          <span className="absolute right-4 top-4 bottom-2 w-[40%] max-w-[170px]">
            {latas.map((url, i) => {
              const pos = leque[i];
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="absolute bottom-0 h-[92%] w-auto [filter:drop-shadow(0_8px_10px_rgb(0_0_0/0.4))]"
                  style={{
                    left: pos.left,
                    zIndex: pos.z,
                    transform: `translateX(-50%) rotate(${pos.rotate}deg) scale(${pos.escala})`,
                    transformOrigin: 'bottom center',
                  }}
                />
              );
            })}
          </span>
        )}
      </div>

      <div className={`relative z-10 p-4 pb-16 ${latas.length ? 'max-w-[56%]' : 'max-w-[85%]'}`}>
        {nome && (
          <h2 className="text-white font-condensed font-bold uppercase text-[24px] leading-[1] tracking-[0.02em] text-balance">{nome}</h2>
        )}
        {(chamada || preco) && (
          <p className="mt-1.5 font-condensed font-bold uppercase text-primaria leading-none">
            {chamada && <span className="block text-[18px] tracking-[0.04em]">{chamada}</span>}
            {preco && <span className="block text-[38px] tracking-[0.01em] tabular-nums">{preco}</span>}
          </p>
        )}
        {apoio && <p className="mt-1.5 text-[12px] text-topo-texto leading-snug">{apoio}</p>}
      </div>

      {comLink && <BotaoBanner>{rotulo}</BotaoBanner>}
    </div>
  );
};

const MARGEM = 16; // px-4 do trilho: o slide encaixa a 16px da borda

/** Slide mais perto da posição de encaixe do trilho. */
function indiceNaTela(el: HTMLElement | null): number {
  if (!el) return 0;
  const distancias = [...el.children].map((f) => Math.abs((f as HTMLElement).offsetLeft - MARGEM - el.scrollLeft));
  return distancias.indexOf(Math.min(...distancias));
}

function irPara(el: HTMLElement | null, i: number) {
  const alvo = el?.children[i] as HTMLElement | undefined;
  if (alvo) el!.scrollTo({ left: alvo.offsetLeft - MARGEM, behavior: 'smooth' });
}

/**
 * Todos os banners num lugar só, como no app do Zé: os do ERP e o de instalar o
 * app/ativar notificações, passando sozinhos a cada 5 s, com a ponta do próximo
 * aparecendo. Para quando a pessoa mexe ou prefere menos movimento.
 */
export const BannerCarrossel: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const modoApp = useModoBannerApp();

  const slides: { id: string; conteudo: React.ReactNode }[] = banners.map((banner, i) => {
    const destino = destinoBanner(banner);
    const conteudo = <ConteudoBanner banner={banner} primeiro={i === 0} comLink={!!destino} />;
    return {
      id: banner.id,
      conteudo: !destino ? (
        conteudo
      ) : destino.externo ? (
        <a href={destino.href} target="_blank" rel="noopener noreferrer" className="flex w-full rounded-2xl">
          {conteudo}
        </a>
      ) : (
        <Link href={destino.href} className="flex w-full rounded-2xl">
          {conteudo}
        </Link>
      ),
    };
  });
  if (modoApp) slides.push({ id: 'app', conteudo: <SlideApp modo={modoApp} /> });
  const total = slides.length;

  useEffect(() => {
    if (total < 2 || pausado) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => irPara(trilho.current, (indiceNaTela(trilho.current) + 1) % total), 5000);
    return () => clearInterval(id);
  }, [total, pausado]);

  if (!total) return null;

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className="pb-2">
      <div
        ref={trilho}
        onScroll={() => setAtual(indiceNaTela(trilho.current))}
        onPointerDown={() => setPausado(true)}
        onFocus={() => setPausado(true)}
        className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 scroll-px-4"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            // flex: o slide estica até o mais alto da fileira (banner de texto longo x banner do app)
            className={`flex shrink-0 snap-start ${total > 1 ? 'w-[calc(100%-28px)] sm:w-[calc(50%-6px)]' : 'w-full'}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${total}`}
          >
            {slide.conteudo}
          </div>
        ))}
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                setPausado(true);
                irPara(trilho.current, i);
              }}
              aria-label={`Ir para o destaque ${i + 1}`}
              aria-current={i === atual}
              className="p-1.5"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === atual ? 'w-4 bg-tinta' : 'w-1.5 bg-controle'}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
