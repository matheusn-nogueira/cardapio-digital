'use client';

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { Categoria } from '@/lib/tipos';

interface Props {
  /** `imagem_url` já resolvida pela página (foto da categoria ou de um produto dela). */
  categorias: Categoria[];
  ativaId?: string;
  /** Mantido por compatibilidade: os chips já são compactos. */
  compacta?: boolean;
}

/** Chips de categoria como no app do Zé: "Categorias" primeiro, depois cada uma com a foto pequena do produto principal. */
export const CategoriasLista: React.FC<Props> = ({ categorias, ativaId }) => {
  if (!categorias.length) return null;
  const chip = (ativa: boolean) =>
    `flex items-center gap-2 h-11 pl-2 pr-4 rounded-xl border whitespace-nowrap text-[15px] ${
      ativa ? 'border-tinta bg-tinta text-white font-bold' : 'border-[#E3E3E3] bg-white text-tinta'
    }`;
  return (
    <nav aria-label="Categorias" className="bg-white pt-3 pb-2">
      <ul className="flex gap-2 overflow-x-auto no-scrollbar px-4 scroll-px-4">
        <li className="shrink-0">
          <Link href="/busca" className={chip(false)}>
            <LayoutGrid className="w-6 h-6 ml-1" aria-hidden="true" />
            Categorias
          </Link>
        </li>
        {categorias.map((cat) => {
          const ativa = cat.id === ativaId;
          return (
            <li key={cat.id} className="shrink-0">
              <Link href={`/categoria/${cat.id}`} aria-current={ativa ? 'page' : undefined} className={chip(ativa)}>
                <span className="w-7 h-7 rounded-md bg-white flex items-center justify-center overflow-hidden" aria-hidden="true">
                  {cat.imagem_url ? (
                    <Image src={cat.imagem_url} alt="" width={56} height={56} quality={70} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[16px]">{cat.icone || '🛒'}</span>
                  )}
                </span>
                {cat.nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
