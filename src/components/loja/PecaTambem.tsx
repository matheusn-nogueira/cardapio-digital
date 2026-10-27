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
      // carvão divide a categoria com o gelo, mas não é o que falta para quem leva bebida
      if (/carv[aã]o/i.test(p.nome)) return -1;
      const nome = `${categoriaDoProduto(p)?.nome ?? ''} ${p.categoria}`;
      return COMPLEMENTOS.findIndex((re) => re.test(nome));
    };
    // um de cada grupo por vez (gelo, refri, petisco, gelo…), para a prateleira não virar só gelo
    const porGrupo = COMPLEMENTOS.map(() => [] as Produto[]);
    for (const p of candidatos) {
      const grupo = grupoDe(p);
      if (grupo >= 0) porGrupo[grupo].push(p);
    }
    // gelo comum (escama, filtrado) antes do gelo de sabor
    const deSabor = (p: Produto) => /sabor|coco|ma[cç][aã]|morango|melancia|maracuj|laranja|lim[aã]o|beats/i.test(p.nome);
    porGrupo[0].sort((a, b) => Number(deSabor(a)) - Number(deSabor(b)));
    const complementos: Produto[] = [];
    for (let i = 0; porGrupo.some((g) => i < g.length); i++) {
      for (const g of porGrupo) if (i < g.length) complementos.push(g[i]);
    }
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
      <h3 className="text-[13px] font-medium uppercase tracking-wide text-suave mb-2">Peça também</h3>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 scroll-px-3.5 pb-1 snap-x">
        {sugestoes.map((produto) => (
          <article key={produto.id} className="w-[112px] shrink-0 snap-start bg-white rounded-xl shadow-cartao overflow-hidden">
            <div className="relative w-full aspect-square p-2 bg-white">
              <ImagemProduto produto={produto} />
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
            </div>
            <div className="px-2 pt-1.5 pb-2 border-t border-borda">
              <span className="block text-[12px] text-tinta leading-snug line-clamp-2 min-h-[2.5em]">{produto.nome}</span>
              <span className="block text-[14px] font-bold text-tinta tabular-nums mt-1">
                {formatarPreco(melhorPreco(produto, 1, false).total)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
