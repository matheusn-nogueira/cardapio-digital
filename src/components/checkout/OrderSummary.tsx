'use client';

import React from 'react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { calcularSubtotal, freteFinal } from '@/lib/carrinho';
import { formatarPreco } from '@/lib/formatacao';
import { precoOferta, rotuloOferta } from '@/lib/ofertas';
import type { FormaPagamento } from '@/lib/tipos';

interface OrderSummaryProps {
  forma: FormaPagamento | null;
  /** undefined = frete ainda não calculado; null = a confirmar */
  freteBase: number | null | undefined;
  mostrarItens?: boolean;
}

export function totaisDoPedido(
  subtotal: number,
  freteBase: number | null | undefined,
  freteGratisAcima: number | null,
) {
  const frete = freteBase === undefined ? undefined : freteFinal(freteBase, subtotal, freteGratisAcima);
  return { subtotal, frete, total: subtotal + (frete ?? 0) };
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ forma, freteBase, mostrarItens = true }) => {
  const { home } = useCardapio();
  const { linhas } = useCart();
  const subtotal = calcularSubtotal(linhas, forma);
  const { frete, total } = totaisDoPedido(subtotal, freteBase, home.config.frete_gratis_acima);

  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm" aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="text-[15px] font-bold mb-3">
        Resumo do pedido
      </h2>
      {mostrarItens && (
        <ul className="space-y-2 mb-3 pb-3 border-b border-borda">
          {linhas.map(({ item, produto, oferta }) => {
            const rotulo = rotuloOferta(oferta, produto);
            return (
              <li key={oferta.id} className="flex justify-between gap-3 text-[14px]">
                <span className="text-tinta/85 min-w-0">
                  <span className="font-bold text-tinta">{item.quantidade}×</span> {produto.nome}
                  {rotulo !== 'Unidade' && <span className="text-suave"> · {rotulo}</span>}
                  {oferta.quente && <span className="text-suave"> · natural</span>}
                </span>
                <span className="font-medium shrink-0">{formatarPreco(precoOferta(oferta, forma) * item.quantidade)}</span>
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
        <p className="mt-1.5 text-[12px] text-suave">O frete será confirmado pela loja antes da entrega.</p>
      )}
      <p className="mt-2.5 text-[11px] text-suave leading-[1.4]">
        🔞 Venda e consumo de bebida alcoólica proibidos para menores de 18 anos.
      </p>
    </section>
  );
};
