'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/lib/tipos';
import { corSegura, urlExternaSegura } from '@/lib/formatacao';
import { SlideApp, useModoBannerApp } from './BannerApp';

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

// Banner sem foto ganha um fundo em degradê com a cor escolhida no ERP e
// círculos na cor da loja, para não parecer um bloco vazio.
const ConteudoBanner: React.FC<{ banner: Banner; primeiro: boolean; comLink: boolean }> = ({ banner, primeiro, comLink }) => {
  const cor = corSegura(banner.cor_fundo, '#1A1A1A');
  return (
    <div
      className="relative h-44 rounded-2xl overflow-hidden flex items-end p-5"
      style={{ background: banner.imagem_url ? cor : `linear-gradient(135deg, ${cor} 0%, ${cor} 45%, var(--cor-primaria) 160%)` }}
    >
      {banner.imagem_url ? (
        <>
          <Image src={banner.imagem_url} alt="" fill priority={primeiro} sizes="(max-width: 640px) 100vw, 640px" quality={75} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
        </>
      ) : (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute -right-12 -top-20 w-60 h-60 rounded-full bg-primaria/15" />
          <span className="absolute right-10 top-16 w-28 h-28 rounded-full bg-primaria/25" />
          <span className="absolute right-28 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
        </div>
      )}
      {(banner.titulo || banner.subtitulo) && (
        <div className="relative z-10 max-w-[70%]">
          {banner.titulo && <h2 className="text-white font-black text-[22px] leading-[1.1] tracking-tight drop-shadow-sm">{banner.titulo}</h2>}
          {banner.subtitulo && <p className="text-white/90 text-[13px] mt-1.5 leading-snug">{banner.subtitulo}</p>}
          {comLink && (
            <span className="inline-flex items-center h-9 px-5 mt-3 rounded-lg bg-primaria text-primaria-texto text-[14px] font-bold">
              Saiba mais
            </span>
          )}
        </div>
      )}
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
        <a href={destino.href} target="_blank" rel="noopener noreferrer" className="block rounded-2xl">
          {conteudo}
        </a>
      ) : (
        <Link href={destino.href} className="block rounded-2xl">
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
    <section aria-roledescription="carrossel" aria-label="Destaques" className="pt-1 pb-2">
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
            className={`shrink-0 snap-start ${total > 1 ? 'w-[calc(100%-28px)] sm:w-[calc(50%-6px)]' : 'w-full'}`}
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
              <span className={`block h-1.5 rounded-full transition-all ${i === atual ? 'w-4 bg-tinta' : 'w-1.5 bg-[#C8C8C8]'}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
