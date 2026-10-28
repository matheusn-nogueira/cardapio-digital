'use client';

import React from 'react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { freteFinal } from '@/lib/carrinho';
import { formatarPreco } from '@/lib/formatacao';
import type { LinhaCarrinho } from '@/lib/carrinho';
import { descreverVariante, usaPrecoCartao } from '@/lib/ofertas';
import { descreverCombinacao, melhorPreco, subtotalCarrinho, totalDaLinha } from '@/lib/precoQuantidade';
import type { FormaPagamento } from '@/lib/tipos';

interface OrderSummaryProps {
  forma: FormaPagamento | null;
  /** undefined = frete ainda não calculado; null = a confirmar */
  freteBase: number | null | undefined;
  mostrarItens?: boolean;
}

/**
 * Complemento da linha para resumo/confirmação: versão escolhida
 * ("Natural (sem gelar) · Pack 12 · 24 un") ou a combinação com desconto ("1 pack de 12 + 1 un").
 */
export function complementoDaLinha(l: LinhaCarrinho, cartao: boolean): string | null {
  if (l.variante) {
    return `${descreverVariante(l.variante)}${l.variante.qtd > 1 ? ` · ${l.quantidade * l.variante.qtd} un` : ''}`;
  }
  const preco = melhorPreco(l.produto, l.quantidade, cartao);
  const combinacao = preco.economia > 0 ? descreverCombinacao(preco.partes) : null;
  return [l.produto.quente ? 'natural' : null, combinacao].filter(Boolean).join(' · ') || null;
}

export function totaisDoPedido(
  subtotal: number,
  freteBase: number | null | undefined,
  freteGratisAcima: number | null,
) {
  const frete = freteBase === undefined ? undefined : freteFinal(freteBase, subtotal, freteGratisAcima);
  return { subtotal, frete, total: Math.round((subtotal + (frete ?? 0)) * 100) / 100 };
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ forma, freteBase, mostrarItens = true }) => {
  const { home } = useCardapio();
  const { linhas } = useCart();
  const cartao = usaPrecoCartao(forma);
  const subtotal = subtotalCarrinho(linhas, cartao);
  const { frete, total } = totaisDoPedido(subtotal, freteBase, home.config.frete_gratis_acima);

  return (
    <section className="bg-white rounded-xl p-4 shadow-cartao" aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="text-[15px] font-bold text-tinta mb-3">
        Resumo do pedido
      </h2>
      {mostrarItens && (
        <ul className="space-y-2 mb-3 pb-3 border-b border-borda">
          {linhas.map((l) => {
            const complemento = complementoDaLinha(l, cartao);
            return (
              <li key={l.chave} className="flex justify-between gap-3 text-[14px]">
                <span className="text-tinta/85 min-w-0">
                  <span className="font-bold text-tinta tabular-nums">{l.quantidade}×</span> {l.produto.nome}
                  {complemento && <span className="block text-[12px] text-suave">{complemento}</span>}
                </span>
                <span className="font-medium shrink-0 tabular-nums">{formatarPreco(totalDaLinha(l, cartao))}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex justify-between mb-1.5 text-[14px]">
        <span>Subtotal</span>
        <span>{formatarPreco(subtotal)}</span>
      </div>
      <div className="flex justify-between mb-1.5 text-[14px]">
        <span>Entrega</span>
        {frete === undefined ? (
          <span className="text-suave">calcular no endereço</span>
        ) : frete === null ? (
          <span className="text-suave">a confirmar</span>
        ) : frete === 0 ? (
          <span className="text-sucesso font-bold">Grátis</span>
        ) : (
          <span>{formatarPreco(frete)}</span>
        )}
      </div>
      <hr className="my-2.5 border-t border-borda" />
      <div className="flex justify-between text-[17px] font-black">
        <span>Total</span>
        <span>{formatarPreco(total)}</span>
      </div>
      {frete === null && (
        <p className="mt-1.5 text-[12px] text-suave">A loja confirma a taxa de entrega com você pelo WhatsApp.</p>
      )}
      <p className="mt-2.5 text-[12px] text-suave leading-[1.4]">
        Venda e consumo de bebida alcoólica proibidos para menores de 18 anos. Beba com moderação.
      </p>
    </section>
  );
};
