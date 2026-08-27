'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { CartDrawer } from '@/components/layout/CartDrawer';

export const FloatingCart: React.FC = () => {
  const { itemCount, total } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (itemCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-[#F5F5F5] bg-opacity-95 backdrop-blur-sm z-40">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-ze-yellow text-[#333] font-bold text-[15px] py-4 rounded-xl flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-all"
        >
          <span>VER SACOLA ({itemCount})</span>
          <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </button>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
