'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  const [carregou, setCarregou] = useState(false);

  if (produto.imagem_url && !quebrou) {
    // Versão reduzida pelo otimizador do Next (as originais têm ~500 KB).
    const larguras = tamanho === 'grande' ? '(max-width: 640px) 90vw, 480px' : tamanho === 'pequena' ? '64px' : '(max-width: 640px) 45vw, 220px';
    return (
      <div className={`relative w-full h-full ${carregou ? '' : 'animate-pulse bg-[#F2F2F2] rounded-xl'}`}>
        <Image
          src={produto.imagem_url}
          alt={produto.nome}
          fill
          sizes={larguras}
          quality={70}
          onLoad={() => setCarregou(true)}
          onError={() => setQuebrou(true)}
          className="object-contain"
        />
      </div>
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
