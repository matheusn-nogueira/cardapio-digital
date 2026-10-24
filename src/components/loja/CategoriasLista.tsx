'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';
import { corSegura } from '@/lib/formatacao';

// A partir daqui as categorias viram duas linhas (como no Zé), roladas juntas.
const MINIMO_DUAS_LINHAS = 8;

interface Props {
  /** `imagem_url` já resolvida pela página (foto da categoria ou de um produto dela). */
  categorias: Categoria[];
  ativaId?: string;
  /** Uma linha de atalhos menores (páginas de categoria). */
  compacta?: boolean;
}

/** Atalhos de categoria em blocos quadrados com a foto de um produto (ou o ícone, sem foto). */
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

  const largura = compacta ? 'auto-cols-[68px]' : 'auto-cols-[84px]';
  const bloco = compacta ? 'w-[68px] h-[60px] text-[26px]' : 'w-[84px] h-[76px] text-[38px]';

  return (
    <nav aria-label="Categorias" className={`bg-white ${compacta ? 'pt-3 pb-2' : 'pt-4 pb-3'}`}>
      <ul
        ref={(el) => {
          trilho.current = el;
          if (el && barra === null && el.scrollWidth > el.clientWidth) medir();
        }}
        onScroll={medir}
        className={`grid grid-flow-col ${largura} gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 ${
          duasLinhas ? 'grid-rows-2' : 'grid-rows-1'
        }`}
      >
        {categorias.map((cat) => {
          const ativa = cat.id === ativaId;
          return (
            <li key={cat.id}>
              <Link
                href={`/categoria/${cat.id}`}
                aria-current={ativa ? 'page' : undefined}
                className="flex flex-col items-center gap-1.5 rounded-xl"
              >
                <span
                  className={`${bloco} rounded-xl overflow-hidden flex items-center justify-center border-2 ${
                    ativa ? 'border-primaria' : cat.imagem_url ? 'border-[#EFEFEF] shadow-cartao' : 'border-transparent'
                  }`}
                  // foto de produto tem fundo branco: o bloco fica branco para ela não virar um quadrado dentro do cinza
                  style={{ background: cat.imagem_url ? '#FFFFFF' : corSegura(cat.cor_fundo, '#F2F2F2') }}
                  aria-hidden="true"
                >
                  {cat.imagem_url ? (
                    <Image
                      src={cat.imagem_url}
                      alt=""
                      width={168}
                      height={152}
                      quality={70}
                      className={`w-full h-full object-contain ${compacta ? 'p-1.5' : 'p-2'}`}
                    />
                  ) : (
                    cat.icone || '🛒'
                  )}
                </span>
                <span
                  className={`w-full text-center leading-tight font-bold line-clamp-2 ${
                    compacta ? 'text-[11.5px]' : 'text-[12.5px]'
                  } ${ativa ? 'text-tinta' : 'text-[#4A4A4A]'}`}
                >
                  {cat.nome}
                </span>
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
