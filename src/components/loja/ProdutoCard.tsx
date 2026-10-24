'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { descontoDoBloco, detalheVariante, melhorBloco, precoPorUnidade } from '@/lib/ofertas';
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
 * Card de produto: foto com os selos e o "+" por cima, nome e preço embaixo
 * ocupando a largura toda (o "+" sobre a foto deixa o texto respirar).
 */
export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, formato = 'grade' }) => {
  const { abrirProduto } = useCardapio();
  const { adicionar, unidadesDoProduto } = useCart();
  // preço de 1 unidade pela mesma regra da sacola; o melhor bloco chama atenção para o desconto
  const unidade = melhorPreco(produto, 1, false).total;
  const bloco = melhorBloco(produto.ofertas);
  // selo "-6%" só quando o pack sai mais barato que as unidades avulsas
  const desconto = bloco ? descontoDoBloco(bloco, unidade) : 0;
  const porUnidade = bloco ? precoPorUnidade(bloco, 'pix') : null;
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

  return (
    <article
      className={`bg-white rounded-lg shadow-cartao flex flex-col overflow-hidden ${
        formato === 'carrossel' ? 'w-[140px] shrink-0 snap-start' : 'w-full'
      }`}
    >
      <div className="relative w-full aspect-square bg-white">
        <button type="button" onClick={abrir} className="absolute inset-0 p-3 text-left" aria-label={`Ver ${produto.nome}`}>
          <ImagemProduto produto={produto} />
        </button>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 pointer-events-none">
          {desconto > 0 && (
            <span className="bg-desconto text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">-{desconto}%</span>
          )}
          {produto.selo && (
            <span className="bg-desconto text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">{produto.selo}</span>
          )}
          {(produto.quente || temNatural) && (
            <span className="bg-bloco text-[#4A4A4A] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {produto.quente ? 'Natural' : 'Também natural'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={aoAdicionar}
          aria-label={pedeEscolha ? `Escolher versão de ${produto.nome}` : `Adicionar 1 unidade de ${produto.nome} à sacola`}
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
          {naSacola > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tinta text-white text-[10px] font-bold flex items-center justify-center">
              {naSacola}
              <span className="sr-only"> na sacola</span>
            </span>
          )}
        </button>
      </div>

      {/* a ação de abrir já está no botão da foto; aqui é só o texto, clicável por conveniência */}
      <div onClick={abrir} className="flex flex-col flex-1 border-t border-[#EFEFEF] px-2.5 pt-2 pb-2.5 cursor-pointer">
        <span className="text-[13.5px] text-[#4A4A4A] leading-snug line-clamp-2 min-h-[2.5em]">{produto.nome}</span>
        <span className="text-[17px] font-bold text-tinta leading-tight tabular-nums mt-1">{formatarPreco(unidade)}</span>
        {bloco && porUnidade != null ? (
          <span className="text-[11px] font-bold text-sucesso leading-tight mt-0.5 truncate">
            {detalheVariante(bloco)} · {formatarPreco(porUnidade)}/un
          </span>
        ) : produto.quente ? (
          <span className="text-[11px] font-medium text-suave leading-tight mt-0.5 truncate">Natural (sem gelar)</span>
        ) : null}
      </div>
    </article>
  );
};
