'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  /** categoria do cardápio desta prateleira: marca o chip dela enquanto a seção está na tela */
  categoriaId?: string;
  /** primeira prateleira da home: as fotos dos primeiros cards baixam antes das outras */
  prioridade?: boolean;
  /**
   * Prateleira lá embaixo: os cards só são montados quando a pessoa rola até perto dela
   * (28/10/2026: as 27 prateleiras montadas de uma vez punham 229 fotos e 1 MB de HTML na home).
   * Até lá fica um espaço do mesmo tamanho, com o título, para a página não pular.
   */
  adiada?: boolean;
}

/** true quando o elemento chega a ~1,5 tela de distância (e fica true). */
function useChegouPerto(ref: React.RefObject<HTMLElement | null>, ativo: boolean): boolean {
  const [perto, setPerto] = useState(!ativo);
  useEffect(() => {
    const el = ref.current;
    if (!ativo || perto || !el) return;
    const obs = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setPerto(true), { rootMargin: '150% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, ativo, perto]);
  return perto;
}

/** Prateleira horizontal da home. Não renderiza nada se ficar vazia. */
export const Vitrine: React.FC<VitrineProps> = ({ titulo, ids, linkVerTodos, categoriaId, prioridade = false, adiada = false }) => {
  const { produtoPorId } = useCardapio();
  const secao = useRef<HTMLElement>(null);
  const montar = useChegouPerto(secao, adiada);
  const produtos = ids.map((id) => produtoPorId.get(id)).filter((p): p is Produto => !!p);
  if (!produtos.length) return null;

  return (
    <section ref={secao} className="mb-8" aria-label={titulo} data-categoria={categoriaId}>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="font-condensed text-[20px] font-bold uppercase text-tinta tracking-[0.04em] leading-tight">{titulo}</h2>
        {linkVerTodos && (
          <Link href={linkVerTodos} aria-label={`Ver todos: ${titulo}`} className="w-10 h-9 -mr-2 flex items-center justify-center text-tinta">
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </Link>
        )}
      </div>
      {montar ? (
        <div className="flex items-start gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 snap-x">
          {produtos.map((produto, i) => (
            // no celular cabem 2 cards e a ponta do terceiro na primeira tela
            <ProdutoCard key={produto.id} produto={produto} formato="carrossel" prioridade={prioridade && i < 3} />
          ))}
        </div>
      ) : (
        // mesma altura do card (foto 150 + preço + nome em 2 linhas) para a página não pular
        <div className="h-[237px]" aria-hidden="true" />
      )}
    </section>
  );
};
