'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

export const OrderSummary: React.FC = () => {
  const { subtotal, total } = useCart();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 sticky top-20 shadow-sm border border-[#f5f5f5]">
      <h3 className="text-[15px] font-bold mb-3.5">Resumo do Pedido</h3>
      <div className="flex justify-between mb-1.5 text-[14px]">
        <span>Subtotal</span>
        <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
      </div>
      <div className="flex justify-between mb-1.5 text-[14px]">
        <span>Entrega</span>
        <span className="text-[#43A047] font-medium">Grátis</span>
      </div>
      <hr className="my-2.5 border-t border-[#eee]" />
      <div className="flex justify-between text-[16px] font-bold">
        <span>Total</span>
        <span>R$ {total.toFixed(2).replace('.', ',')}</span>
      </div>
      <p className="mt-2.5 text-[11px] text-[#999] leading-[1.4]">
        🔞 Venda e consumo de bebida alcoólica proibida para menores de 18 anos.
      </p>
    </div>
  );
};
