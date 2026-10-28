'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Beer, Candy, Cigarette, CupSoda, Flame, GlassWater, Martini, Package, Snowflake, Wine } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import type { Produto } from '@/lib/tipos';

// Paleta suave para o placeholder (escolhida pelo nome, sempre a mesma por produto).
const FUNDOS = ['#FFF4D6', '#E8F1FF', '#FDE8E8', '#E7F6EC', '#F1EAFE', '#FFEBD9'];

// Ícone do placeholder pelo tipo de bebida (categoria do cardápio ou do produto).
const ICONES: [RegExp, React.FC<{ className?: string }>][] = [
  [/cervej|chopp/i, Beer],
  [/vinho|espumante/i, Wine],
  [/destilad|drink|whisk|vodka|cacha|gin|licor/i, Martini],
  [/gelo/i, Snowflake],
  [/água|agua/i, GlassWater],
  [/refri|energ|suco|ch[áa]/i, CupSoda],
  [/churras|carv/i, Flame],
  [/bombon|doce|chocolate/i, Candy],
  [/tabac|cigar/i, Cigarette],
];

function iconePlaceholder(texto: string, className: string): React.ReactElement {
  const Icone = ICONES.find(([re]) => re.test(texto))?.[1] ?? Package;
  return <Icone className={className} />;
}

function indiceDe(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h % FUNDOS.length;
}

/** Foto do produto ou, sem foto (ou se a URL quebrar), um placeholder com o ícone da categoria. */
export const ImagemProduto: React.FC<{
  produto: Produto;
  tamanho?: 'pequena' | 'media' | 'grande';
  /** primeiras fotos da tela: baixam antes das outras, sem esperar a rolagem */
  prioridade?: boolean;
}> = ({ produto, tamanho = 'media', prioridade = false }) => {
  const { categoriaDoProduto } = useCardapio();
  const [quebrou, setQuebrou] = useState(false);

  if (produto.imagem_url && !quebrou) {
    // Versão reduzida pelo otimizador do Next (as originais têm ~500 KB).
    const larguras = tamanho === 'grande' ? '(max-width: 640px) 90vw, 480px' : tamanho === 'pequena' ? '64px' : '(max-width: 640px) 45vw, 220px';
    return (
      <div className="relative w-full h-full">
        <Image
          src={produto.imagem_url}
          alt={produto.nome}
          fill
          sizes={larguras}
          quality={70}
          priority={prioridade}
          onError={() => setQuebrou(true)}
          // Entrada suave só com CSS (28/10/2026): antes a foto vinha escondida e só aparecia quando o
          // JavaScript carregava e avisava que ela chegou; num 4G fraco os cards ficavam vazios por segundos.
          className="object-contain animate-fade-in"
        />
      </div>
    );
  }

  const tamanhoIcone = tamanho === 'grande' ? 'w-16 h-16' : tamanho === 'pequena' ? 'w-6 h-6' : 'w-10 h-10';
  const icone = iconePlaceholder(`${categoriaDoProduto(produto)?.nome ?? ''} ${produto.categoria}`, `${tamanhoIcone} text-tinta/35`);
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-xl"
      style={{ background: FUNDOS[indiceDe(produto.nome)] }}
      role="img"
      aria-label={produto.nome}
    >
      {icone}
      {tamanho !== 'pequena' && (
        <span className="px-2 text-center text-[12px] font-bold uppercase tracking-wide text-tinta/60 line-clamp-1">
          {produto.marca && produto.marca !== produto.categoria ? produto.marca : produto.categoria}
        </span>
      )}
    </div>
  );
};
