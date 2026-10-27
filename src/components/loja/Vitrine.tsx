'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import type { Produto } from '@/lib/tipos';
import { ProdutoCard } from './ProdutoCard';

interface VitrineProps {
  titulo: string;
  /** Ids de produto na ordem de exibição (os que saíram do catálogo são ignorados). */
  ids: string[];
  linkVerTodos?: string;
}

/** Prateleira horizontal da home. Não renderiza nada se ficar vazia. */
export const Vitrine: React.FC<VitrineProps> = ({ titulo, ids, linkVerTodos }) => {
  const { produtoPorId } = useCardapio();
  const produtos = ids.map((id) => produtoPorId.get(id)).filter((p): p is Produto => !!p);
  if (!produtos.length) return null;

  return (
    <section className="mb-6" aria-label={titulo}>
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-condensed text-[24px] font-extrabold uppercase text-tinta tracking-tight leading-tight">{titulo}</h2>
        {linkVerTodos && (
          <Link href={linkVerTodos} aria-label={`Ver todos: ${titulo}`} className="w-10 h-9 -mr-2 flex items-center justify-center text-tinta">
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 snap-x">
        {produtos.map((produto) => (
          <ProdutoCard key={produto.id} produto={produto} formato="carrossel" />
        ))}
      </div>
    </section>
  );
};
