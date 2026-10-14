'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { ofertaPrincipal } from '@/lib/ofertas';
import type { Produto } from '@/lib/tipos';
import { toastEvent } from '@/components/ui/Toast';
import { ImagemProduto } from './ImagemProduto';

interface ProdutoCardProps {
  produto: Produto;
  /** carrossel = largura fixa (vitrines); grade = ocupa a coluna */
  formato?: 'carrossel' | 'grade';
}

export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, formato = 'grade' }) => {
  const { abrirProduto } = useCardapio();
  const { adicionar, itens } = useCart();
  const principal = ofertaPrincipal(produto);
  const variasOfertas = produto.ofertas.length > 1;
  const naSacola = itens
    .filter((i) => produto.ofertas.some((o) => o.id === i.ofertaId))
    .reduce((soma, i) => soma + i.quantidade, 0);

  const aoAdicionar = () => {
    if (variasOfertas) {
      abrirProduto(produto.id);
      return;
    }
    adicionar(principal.id);
    toastEvent.show(`${produto.nome} na sacola`);
  };

  return (
    <article
      className={`relative bg-white rounded-2xl p-2.5 shadow-sm border border-borda flex flex-col ${
        formato === 'carrossel' ? 'w-[148px] shrink-0 snap-start' : 'w-full'
      }`}
    >
      <button
        type="button"
        onClick={() => abrirProduto(produto.id)}
        className="text-left flex flex-col flex-1 rounded-xl"
        aria-label={`Ver ${produto.nome}`}
      >
        <div className="relative w-full aspect-square mb-2 rounded-xl overflow-hidden bg-white">
          <ImagemProduto produto={produto} />
          <div className="absolute top-1 left-1 flex flex-col items-start gap-1">
            {produto.selo && (
              <span className="bg-tinta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{produto.selo}</span>
            )}
          </div>
        </div>
        <span className="text-[16px] font-bold text-tinta leading-tight">{formatarPreco(principal.preco)}</span>
        {variasOfertas ? (
          <span className="text-[11px] font-medium text-sucesso leading-tight mt-0.5">
            {produto.ofertas.length} opções
          </span>
        ) : principal.quente ? (
          <span className="text-[11px] font-medium text-suave leading-tight mt-0.5">Natural (sem gelar)</span>
        ) : null}
        <span className="text-[13px] text-tinta/80 leading-snug line-clamp-2 mt-1 pr-8">{produto.nome}</span>
      </button>

      <button
        type="button"
        onClick={aoAdicionar}
        aria-label={variasOfertas ? `Escolher opção de ${produto.nome}` : `Adicionar ${produto.nome} à sacola`}
        className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center shadow-md active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
        {naSacola > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tinta text-white text-[10px] font-bold flex items-center justify-center">
            {naSacola}
            <span className="sr-only"> na sacola</span>
          </span>
        )}
      </button>
    </article>
  );
};
