'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';
import { corSegura } from '@/lib/formatacao';

// A partir daqui as categorias viram duas linhas (como no Zé), roladas juntas.
const MINIMO_DUAS_LINHAS = 8;

// Cor do ERP quando ninguém escolheu uma (vale como "sem cor").
const COR_PADRAO_ERP = '#F4F4F4';

// Tons claros, um por tipo de bebida, para o texto escuro e a foto (fundo branco
// em multiply) funcionarem em todos. Quem não casa com nenhum pega pela posição.
const PALETA: [RegExp, string][] = [
  [/cervej|chopp/i, '#F7D774'],
  [/gelo/i, '#CDE7F8'],
  [/destilad|whisk|vodka|cacha|gin/i, '#EAC9A2'],
  [/drink|coquet/i, '#F9BFD4'],
  [/vinho|espumante/i, '#E8B4C0'],
  [/refri/i, '#F7B7B0'],
  [/energ/i, '#C9EBD2'],
  [/água|agua|suco|ch[áa]/i, '#BFE0F7'],
  [/churras|carne|carv/i, '#F7C9A8'],
  [/bombon|doce|chocolate/i, '#DCCBF2'],
  [/tabac|cigar/i, '#D9D9D0'],
  [/merce|conveni|snack|salgad/i, '#E9E2C5'],
];

function corDaCategoria(cat: Categoria, indice: number): string {
  const doErp = corSegura(cat.cor_fundo, COR_PADRAO_ERP);
  if (doErp.toUpperCase() !== COR_PADRAO_ERP) return doErp;
  const casada = PALETA.find(([re]) => re.test(cat.nome));
  return casada ? casada[1] : PALETA[indice % PALETA.length][1];
}

interface Props {
  /** `imagem_url` já resolvida pela página (foto da categoria ou de um produto dela). */
  categorias: Categoria[];
  ativaId?: string;
  /** Uma linha de banners menores (páginas de categoria). */
  compacta?: boolean;
}

/**
 * Atalhos de categoria como pequenos banners: cor sólida, nome em negrito à
 * esquerda e a foto do produto principal à direita (ou o ícone, sem foto).
 */
export const CategoriasLista: React.FC<Props> = ({ categorias, ativaId, compacta = false }) => {
  const trilho = useRef<HTMLUListElement>(null);
  // barrinha de rolagem: [início, tamanho] como fração da largura total
  const [barra, setBarra] = useState<[number, number] | null>(null);

  if (!categorias.length) return null;
  const duasLinhas = !compacta && categorias.length >= MINIMO_DUAS_LINHAS;

  const medir = () => {
    const el = trilho.current;
    if (!el || el.scrollWidth <= el.clientWidth) return setBarra(null);
    setBarra([el.scrollLeft / el.scrollWidth, el.clientWidth / el.scrollWidth]);
  };

  const coluna = compacta ? 'auto-cols-[128px]' : 'auto-cols-[156px]';
  const banner = compacta ? 'h-[56px]' : 'h-[88px]';
  const foto = compacta ? 'w-[46px]' : 'w-[64px]';
  const nome = compacta ? 'text-[12px] pr-[48px]' : 'text-[13.5px] pr-[66px]';
  const icone = compacta ? 'text-[24px]' : 'text-[34px]';

  return (
    <nav aria-label="Categorias" className={`bg-white ${compacta ? 'pt-3 pb-2' : 'pt-4 pb-3'}`}>
      <ul
        ref={(el) => {
          trilho.current = el;
          if (el && barra === null && el.scrollWidth > el.clientWidth) medir();
        }}
        onScroll={medir}
        className={`grid grid-flow-col ${coluna} gap-2.5 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 ${
          duasLinhas ? 'grid-rows-2' : 'grid-rows-1'
        }`}
      >
        {categorias.map((cat, i) => {
          const ativa = cat.id === ativaId;
          return (
            <li key={cat.id}>
              <Link
                href={`/categoria/${cat.id}`}
                aria-current={ativa ? 'page' : undefined}
                className={`relative block w-full ${banner} rounded-xl overflow-hidden border-2 ${
                  ativa ? 'border-tinta' : 'border-transparent'
                }`}
                style={{ background: corDaCategoria(cat, i) }}
              >
                <span className={`absolute left-3 top-2.5 font-bold leading-tight text-tinta line-clamp-2 ${nome}`}>{cat.nome}</span>
                {cat.imagem_url ? (
                  // foto com fundo branco: multiply apaga o branco e deixa o produto "recortado" na cor
                  <Image
                    src={cat.imagem_url}
                    alt=""
                    width={128}
                    height={176}
                    quality={70}
                    className={`absolute right-1.5 top-1 bottom-1 h-[calc(100%-8px)] ${foto} object-contain mix-blend-multiply`}
                  />
                ) : (
                  <span className={`absolute right-3 bottom-1.5 leading-none ${icone}`} aria-hidden="true">
                    {cat.icone || '🛒'}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {barra && !compacta && (
        <div className="mx-4 mt-3 h-1 rounded-full bg-[#E6E6E6] overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#9B9B9B]"
            style={{ width: `${barra[1] * 100}%`, marginLeft: `${barra[0] * 100}%` }}
          />
        </div>
      )}
    </nav>
  );
};
