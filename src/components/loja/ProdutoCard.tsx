'use client';

import React from 'react';
import { Minus, Plus, Snowflake, Trash2 } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { blocoEmDestaque, melhorPreco } from '@/lib/precoQuantidade';
import type { Produto } from '@/lib/tipos';
import { ImagemProduto } from './ImagemProduto';

interface ProdutoCardProps {
  produto: Produto;
  /** carrossel = largura fixa (vitrines); grade = ocupa a coluna */
  formato?: 'carrossel' | 'grade';
}

/**
 * Card como no app do Zé: foto num bloco cinza-claro com o "+" redondo amarelo no canto,
 * e embaixo o preço antes do nome. Como no iFood, o "+" põe 1 un na sacola e vira um contador
 * sobre a foto (lixeira no 1, menos, quantidade, mais), sem abrir a ficha.
 * Revisão de usabilidade (26/10/2026):
 * - o "+" tem 36 px à vista (o toque vale 44 px), para não cobrir a foto;
 * - um selo só por card ("Leve + por -", o selo do ERP ou "Natural"); "Também natural" fica na ficha;
 * - o preço é o que o "+" cobra (1 un); a promoção vai na etiqueta verde da foto, dita como no
 *   mercado ("3 por R$ 11,00"), nunca como preço por unidade quebrado;
 * - texto de altura fixa (preço + nome em 2 linhas): todas as prateleiras ficam da mesma altura
 *   e o espaço entre elas é sempre o mesmo.
 */
export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, formato = 'grade' }) => {
  const { abrirProduto } = useCardapio();
  const { adicionar, alterar, remover, unidadesDoProduto, quantidadeNaLinha } = useCart();
  const unidade = melhorPreco(produto, 1, false).total;
  // promoção dita como no mercado: "3 por R$ 11,00"
  const bloco = blocoEmDestaque(produto);
  const naSacola = unidadesDoProduto(produto.id);
  // o contador mexe só na versão padrão; versões escolhidas na ficha (natural em pack…) ficam na sacola
  const naLinha = quantidadeNaLinha(produto.id);

  // versão que muda o produto (ex.: galão com vasilhame) pede escolha; natural não (padrão = gelada)
  const pedeEscolha = produto.variantes.some((v) => !v.quente);

  const abrir = () => abrirProduto(produto.id);
  const aoAdicionar = () => {
    if (pedeEscolha) {
      abrir();
      return;
    }
    adicionar(produto.id, 1);
  };
  const diminuir = () => (naLinha <= 1 ? remover(produto.id) : alterar(produto.id, naLinha - 1));

  const selo = bloco ? `${bloco.qtd} por ${formatarPreco(bloco.preco)}` : produto.selo ?? (produto.quente ? 'Natural' : null);
  // Freezer: selo "Gelada" na cerveja que sai do freezer (some quando o contador cobre a base da foto)
  const gelada = !produto.quente && /cerveja/i.test(produto.categoria) && !(naLinha > 0 && !pedeEscolha);

  return (
    <article className={`flex flex-col ${formato === 'carrossel' ? 'w-[150px] shrink-0 snap-start' : 'w-full'}`}>
      <div className="relative w-full aspect-square rounded-2xl bg-bloco">
        <button type="button" onClick={abrir} className="absolute inset-0 p-4 rounded-2xl" aria-label={`Ver ${produto.nome}`}>
          {/* a foto tem fundo branco: multiply funde o branco com o cinza do bloco */}
          <span className="block w-full h-full mix-blend-multiply">
            <ImagemProduto produto={produto} />
          </span>
        </button>
        {selo && (
          <span
            className={`absolute top-2 left-2 right-2 w-fit truncate pointer-events-none text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
              bloco ? (bloco.desconto ? 'bg-sucesso text-white' : 'bg-tinta text-white') : selo === 'Natural' ? 'bg-white text-tinta' : 'bg-tinta text-white'
            }`}
          >
            {selo}
          </span>
        )}
        {gelada && (
          <span className="absolute left-2 bottom-2 pointer-events-none inline-flex items-center gap-1 h-6 px-1.5 rounded-md bg-tinta text-white text-[10px] font-bold uppercase tracking-wide">
            <Snowflake className="w-3 h-3" aria-hidden="true" />
            Gelada
          </span>
        )}
        {naLinha > 0 && !pedeEscolha ? (
          <div className="absolute left-1.5 right-1.5 bottom-1.5 h-11 rounded-full bg-white shadow-cartao flex items-center justify-between px-1 animate-fade-in">
            <button
              type="button"
              onClick={diminuir}
              aria-label={naLinha <= 1 ? `Tirar ${produto.nome} da sacola` : `Tirar 1 unidade de ${produto.nome}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-perigo active:scale-90 transition-transform"
            >
              {naLinha <= 1 ? <Trash2 className="w-[18px] h-[18px]" aria-hidden="true" /> : <Minus className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />}
            </button>
            <span className="text-[16px] font-bold tabular-nums" aria-live="polite" aria-label={`${naLinha} na sacola`}>
              {naLinha}
            </span>
            <button
              type="button"
              onClick={() => adicionar(produto.id, 1)}
              aria-label={`Adicionar mais 1 unidade de ${produto.nome}`}
              className="w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={aoAdicionar}
            aria-label={pedeEscolha ? `Escolher versão de ${produto.nome}` : `Adicionar 1 unidade de ${produto.nome} à sacola`}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center active:scale-90 transition-transform before:absolute before:-inset-1 before:content-['']"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
            {naSacola > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-tinta text-white text-[11px] font-bold flex items-center justify-center">
                {naSacola}
                <span className="sr-only"> na sacola</span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* a ação de abrir já está no botão da foto; aqui é só o texto, clicável por conveniência */}
      <div onClick={abrir} className="flex flex-col pt-3 cursor-pointer">
        <span className="font-condensed text-[21px] font-extrabold text-tinta leading-tight tabular-nums">{formatarPreco(unidade)}</span>
        {/* sempre 2 linhas de altura, mesmo com nome curto */}
        <span className="text-[15px] text-tinta leading-snug line-clamp-2 min-h-[2.75em] mt-1">{produto.nome}</span>
      </div>
    </article>
  );
};
