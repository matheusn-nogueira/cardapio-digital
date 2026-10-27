'use client';

import React from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';

interface Props {
  categorias: Categoria[];
  ativaId?: string;
  /** Mantido por compatibilidade: os chips já são compactos. */
  compacta?: boolean;
}

/**
 * Chips de categoria só com o nome, sem foto nem ícone (dono, 27/10/2026, Freezer). Na home o
 * primeiro (promoções) fica em destaque; na página de categoria, a categoria aberta.
 * Todas as categorias juntas ficam na aba Busca.
 */
export const CategoriasLista: React.FC<Props> = ({ categorias, ativaId }) => {
  if (!categorias.length) return null;
  return (
    <nav aria-label="Categorias" className="bg-white pt-3 pb-3">
      <ul className="flex gap-2 overflow-x-auto no-scrollbar px-4 scroll-px-4">
        {categorias.map((cat, i) => {
          const ativa = cat.id === ativaId;
          const destaque = ativaId ? ativa : i === 0;
          return (
            <li key={cat.id} className="shrink-0">
              <Link
                href={`/categoria/${cat.id}`}
                aria-current={ativa ? 'page' : undefined}
                className={`flex items-center h-9 px-3.5 rounded-xl whitespace-nowrap text-[14px] ${
                  destaque ? 'bg-tinta text-white font-bold' : 'bg-bloco text-tinta font-semibold'
                }`}
              >
                {cat.nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
