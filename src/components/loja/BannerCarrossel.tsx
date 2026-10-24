'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/lib/tipos';
import { corSegura, urlExternaSegura } from '@/lib/formatacao';

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
// ilustração de bebidas, para não parecer um bloco vazio.
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
        <div className="absolute -right-3 -top-2 flex flex-col items-end gap-1 text-[54px] leading-none rotate-[-8deg] opacity-95 select-none" aria-hidden="true">
          <span>🍺</span>
          <span className="mr-12 -mt-4 text-[44px]">🧊</span>
          <span className="-mt-2 text-[40px]">🥃</span>
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

export const BannerCarrossel: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Avança sozinho a cada 6s (para quando a pessoa interage ou prefere menos movimento).
  useEffect(() => {
    if (banners.length < 2 || pausado) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      const el = trilho.current;
      if (!el) return;
      const proximo = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: proximo * el.clientWidth, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(id);
  }, [banners.length, pausado]);

  if (!banners.length) return null;

  const aoRolar = () => {
    const el = trilho.current;
    if (el) setAtual(Math.round(el.scrollLeft / el.clientWidth));
  };

  const irPara = (i: number) => {
    const el = trilho.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className="py-2 mb-2">
      <div
        ref={trilho}
        onScroll={aoRolar}
        onPointerDown={() => setPausado(true)}
        onFocus={() => setPausado(true)}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {banners.map((banner, i) => {
          const destino = destinoBanner(banner);
          return (
            <div
              key={banner.id}
              className="w-full shrink-0 snap-center px-4"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${banners.length}`}
            >
              {destino ? (
                destino.externo ? (
                  <a href={destino.href} target="_blank" rel="noopener noreferrer" className="block rounded-2xl">
                    <ConteudoBanner banner={banner} primeiro={i === 0} comLink />
                  </a>
                ) : (
                  <Link href={destino.href} className="block rounded-2xl">
                    <ConteudoBanner banner={banner} primeiro={i === 0} comLink />
                  </Link>
                )
              ) : (
                <ConteudoBanner banner={banner} primeiro={i === 0} comLink={false} />
              )}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setPausado(true);
                irPara(i);
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
