'use client';

import React, { useState } from 'react';
import { useCardapio } from '@/context/CardapioContext';
import type { Produto } from '@/lib/tipos';

// Paleta suave para o placeholder (escolhida pelo nome, sempre a mesma por produto).
const FUNDOS = ['#FFF4D6', '#E8F1FF', '#FDE8E8', '#E7F6EC', '#F1EAFE', '#FFEBD9'];

function indiceDe(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h % FUNDOS.length;
}

/** Foto do produto ou, sem foto (ou se a URL quebrar), um placeholder com o ícone da categoria. */
export const ImagemProduto: React.FC<{ produto: Produto; tamanho?: 'pequena' | 'media' | 'grande' }> = ({
  produto,
  tamanho = 'media',
}) => {
  const { categoriaDoProduto } = useCardapio();
  const [quebrou, setQuebrou] = useState(false);

  if (produto.imagem_url && !quebrou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- imagens do storage do Supabase, já leves (webp)
      <img
        src={produto.imagem_url}
        alt={produto.nome}
        loading="lazy"
        decoding="async"
        onError={() => setQuebrou(true)}
        className="w-full h-full object-contain"
      />
    );
  }

  const icone = categoriaDoProduto(produto)?.icone || '🛒';
  const tamanhoIcone = tamanho === 'grande' ? 'text-[64px]' : tamanho === 'pequena' ? 'text-[24px]' : 'text-[40px]';
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-xl"
      style={{ background: FUNDOS[indiceDe(produto.nome)] }}
      role="img"
      aria-label={produto.nome}
    >
      <span className={tamanhoIcone} aria-hidden="true">
        {icone}
      </span>
      {tamanho !== 'pequena' && (
        <span className="px-2 text-center text-[10px] font-bold uppercase tracking-wide text-tinta/50 line-clamp-1">
          {produto.marca && produto.marca !== produto.categoria ? produto.marca : produto.categoria}
        </span>
      )}
    </div>
  );
};
