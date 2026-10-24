'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { melhorPreco } from '@/lib/precoQuantidade';
import type { Produto } from '@/lib/tipos';
import { toastEvent } from '@/components/ui/Toast';
import { ImagemProduto } from './ImagemProduto';

// O que costuma faltar na sacola, na ordem em que vale sugerir (gelo, depois refri e água, depois petisco).
const COMPLEMENTOS = [/gelo/i, /refri|água|agua|suco|energ|t[oô]nica/i, /petisco|salgad|snack|chocolate|doce|amendoim/i];
const MAXIMO = 8;

/** Prateleira "Peça também" da sacola: complementos que ainda não estão nela, com "+" de um toque. */
export const PecaTambem: React.FC = () => {
  const { produtos, categoriaDoProduto, home } = useCardapio();
  const { linhas, adicionar } = useCart();

  const sugestoes = useMemo(() => {
    const naSacola = new Set(linhas.map((l) => l.produto.id));
    // só o que entra na sacola com um toque (versão com escolha abriria o modal)
    const candidatos = produtos.filter((p) => !naSacola.has(p.id) && !p.variantes.some((v) => !v.quente));
    const grupoDe = (p: Produto) => {
      const nome = `${categoriaDoProduto(p)?.nome ?? ''} ${p.categoria}`;
      return COMPLEMENTOS.findIndex((re) => re.test(nome));
    };
    const complementos = candidatos
      .map((p) => ({ p, grupo: grupoDe(p) }))
      .filter((x) => x.grupo >= 0)
      .sort((a, b) => a.grupo - b.grupo)
      .map((x) => x.p);
    // completa com a primeira vitrine (mais pedidos) quando os complementos são poucos
    const porId = new Map(candidatos.map((p) => [p.id, p]));
    const usados = new Set(complementos.map((p) => p.id));
    const maisPedidos = (home.vitrines[0]?.produtos ?? [])
      .map((id) => porId.get(id))
      .filter((p): p is Produto => !!p && !usados.has(p.id));
    return [...complementos, ...maisPedidos].slice(0, MAXIMO);
  }, [produtos, linhas, categoriaDoProduto, home.vitrines]);

  if (!sugestoes.length) return null;

  return (
    <section className="mt-5" aria-label="Peça também">
      <h3 className="text-[13px] font-medium uppercase tracking-wide text-rotulo mb-2">Peça também</h3>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 scroll-px-3.5 pb-1 snap-x">
        {sugestoes.map((produto) => (
          <article
            key={produto.id}
            className="relative w-[112px] shrink-0 snap-start bg-white rounded-lg shadow-cartao overflow-hidden"
          >
            <div className="w-full aspect-square p-2 bg-white">
              <ImagemProduto produto={produto} />
            </div>
            <div className="px-2 pt-1.5 pb-2 border-t border-[#EFEFEF]">
              <span className="block text-[12px] text-[#4A4A4A] leading-snug line-clamp-2 min-h-[2.5em]">{produto.nome}</span>
              <span className="block text-[14px] font-bold text-tinta tabular-nums mt-1 pr-8">
                {formatarPreco(melhorPreco(produto, 1, false).total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                adicionar(produto.id, 1);
                toastEvent.show(`${produto.nome} na sacola`);
              }}
              aria-label={`Adicionar 1 unidade de ${produto.nome} à sacola`}
              className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-primaria text-primaria-texto flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
