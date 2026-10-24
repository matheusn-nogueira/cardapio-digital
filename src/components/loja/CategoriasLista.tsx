'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';
import { corSegura } from '@/lib/formatacao';

// A partir daqui as categorias viram duas linhas (como no Zé), roladas juntas.
const MINIMO_DUAS_LINHAS = 8;

/** Atalhos de categoria em blocos quadrados (ícone/imagem + cor de fundo vindos do banco). */
export const CategoriasLista: React.FC<{ categorias: Categoria[]; ativaId?: string }> = ({ categorias, ativaId }) => {
  const trilho = useRef<HTMLUListElement>(null);
  // barrinha de rolagem: [início, tamanho] como fração da largura total
  const [barra, setBarra] = useState<[number, number] | null>(null);

  if (!categorias.length) return null;
  const duasLinhas = categorias.length >= MINIMO_DUAS_LINHAS;

  const medir = () => {
    const el = trilho.current;
    if (!el || el.scrollWidth <= el.clientWidth) return setBarra(null);
    setBarra([el.scrollLeft / el.scrollWidth, el.clientWidth / el.scrollWidth]);
  };

  return (
    <nav aria-label="Categorias" className="bg-white pt-4 pb-3">
      <ul
        ref={(el) => {
          trilho.current = el;
          if (el && barra === null && el.scrollWidth > el.clientWidth) medir();
        }}
        onScroll={medir}
        className={`grid grid-flow-col auto-cols-[84px] gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 ${
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
                  className={`w-[84px] h-[76px] rounded-xl overflow-hidden flex items-center justify-center text-[38px] border-2 ${
                    ativa ? 'border-primaria' : 'border-transparent'
                  }`}
                  style={{ background: corSegura(cat.cor_fundo, '#F2F2F2') }}
                  aria-hidden="true"
                >
                  {cat.imagem_url ? (
                    <Image src={cat.imagem_url} alt="" width={168} height={152} className="w-full h-full object-cover" />
                  ) : (
                    cat.icone || '🛒'
                  )}
                </span>
                <span className="w-full text-[14px] text-center leading-tight font-bold text-[#4A4A4A] truncate">
                  {cat.nome}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {barra && (
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
