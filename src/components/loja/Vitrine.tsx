'use client';

import React from 'react';
import Link from 'next/link';
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
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[17px] font-bold text-tinta tracking-tight">{titulo}</h2>
        {linkVerTodos && (
          <Link href={linkVerTodos} className="text-[13px] text-sucesso font-bold py-2 pl-3">
            Ver todos
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-2 snap-x">
        {produtos.map((produto) => (
          <ProdutoCard key={produto.id} produto={produto} formato="carrossel" />
        ))}
      </div>
    </section>
  );
};
