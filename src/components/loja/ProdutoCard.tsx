'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { descontoDoBloco, melhorBloco, precoPorUnidade } from '@/lib/ofertas';
import { melhorPreco } from '@/lib/precoQuantidade';
import type { Produto } from '@/lib/tipos';
import { toastEvent } from '@/components/ui/Toast';
import { ImagemProduto } from './ImagemProduto';

interface ProdutoCardProps {
  produto: Produto;
  /** carrossel = largura fixa (vitrines); grade = ocupa a coluna */
  formato?: 'carrossel' | 'grade';
}

/**
 * Card como no app do Zé: foto num bloco cinza-claro com o "+" quadrado amarelo no canto,
 * e embaixo o preço antes do nome. Com desconto no pack ("Leve + por -"), o preço em verde
 * é o da unidade no pack, com o preço avulso riscado e a pílula "-N%".
 */
export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, formato = 'grade' }) => {
  const { abrirProduto } = useCardapio();
  const { adicionar, unidadesDoProduto } = useCart();
  const unidade = melhorPreco(produto, 1, false).total;
  const bloco = melhorBloco(produto.ofertas);
  const desconto = bloco ? descontoDoBloco(bloco, unidade) : 0;
  const porUnidade = bloco && desconto > 0 ? precoPorUnidade(bloco, 'pix') : null;
  const naSacola = unidadesDoProduto(produto.id);
  const temNatural = !produto.quente && produto.variantes.some((v) => v.quente);

  // versão que muda o produto (ex.: galão com vasilhame) pede escolha; natural não (padrão = gelada)
  const pedeEscolha = produto.variantes.some((v) => !v.quente);

  const abrir = () => abrirProduto(produto.id);
  const aoAdicionar = () => {
    if (pedeEscolha) {
      abrir();
      return;
    }
    adicionar(produto.id, 1);
    toastEvent.show(`${produto.nome} na sacola`);
  };

  const selo = porUnidade != null ? 'Leve + por -' : produto.selo;

  return (
    <article className={`flex flex-col ${formato === 'carrossel' ? 'w-[150px] shrink-0 snap-start' : 'w-full'}`}>
      <div className="relative w-full aspect-square rounded-2xl bg-[#F4F4F4]">
        <button type="button" onClick={abrir} className="absolute inset-0 p-4 rounded-2xl" aria-label={`Ver ${produto.nome}`}>
          {/* a foto tem fundo branco: multiply funde o branco com o cinza do bloco */}
          <span className="block w-full h-full mix-blend-multiply">
            <ImagemProduto produto={produto} />
          </span>
        </button>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 pointer-events-none">
          {selo && (
            <span
              className={`text-[12px] font-bold px-2 py-0.5 rounded-full text-white ${porUnidade != null ? 'bg-sucesso' : 'bg-tinta'}`}
            >
              {selo}
            </span>
          )}
          {(produto.quente || temNatural) && (
            <span className="bg-white text-[#4A4A4A] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {produto.quente ? 'Natural' : 'Também natural'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={aoAdicionar}
          aria-label={pedeEscolha ? `Escolher versão de ${produto.nome}` : `Adicionar 1 unidade de ${produto.nome} à sacola`}
          className="absolute -bottom-1 -right-1 w-12 h-12 rounded-2xl bg-primaria text-primaria-texto flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
          {naSacola > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-tinta text-white text-[11px] font-bold flex items-center justify-center">
              {naSacola}
              <span className="sr-only"> na sacola</span>
            </span>
          )}
        </button>
      </div>

      {/* a ação de abrir já está no botão da foto; aqui é só o texto, clicável por conveniência */}
      <div onClick={abrir} className="flex flex-col pt-3 cursor-pointer">
        {porUnidade != null ? (
          <>
            <span className="text-[19px] font-bold text-sucesso leading-tight tabular-nums">{formatarPreco(porUnidade)}</span>
            <span className="flex items-center gap-1.5 mt-0.5 text-[12.5px] text-suave tabular-nums">
              1un. {formatarPreco(unidade)}
              <span className="px-1.5 py-px rounded-full bg-sucesso text-white text-[12px] font-bold">-{desconto}%</span>
            </span>
          </>
        ) : (
          <span className="text-[19px] font-bold text-tinta leading-tight tabular-nums">{formatarPreco(unidade)}</span>
        )}
        <span className="text-[15px] text-[#3A3A3A] leading-snug line-clamp-2 mt-1.5">{produto.nome}</span>
      </div>
    </article>
  );
};
