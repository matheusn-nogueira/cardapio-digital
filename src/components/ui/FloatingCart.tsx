'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { formatarPreco } from '@/lib/formatacao';

const ROTAS_SEM_BARRA = ['/checkout', '/payment', '/confirmation'];

/** Barra "Ver sacola" logo acima da barra de abas (celular e desktop). */
export const FloatingCart: React.FC = () => {
  const { quantidadeTotal, subtotal, abrirSacola, sacolaAberta } = useCart();
  const hidratado = useHidratado();
  const pathname = usePathname();

  if (!hidratado || quantidadeTotal === 0 || sacolaAberta || ROTAS_SEM_BARRA.includes(pathname)) return null;

  return (
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 px-4 pb-2 z-40 pointer-events-none">
      <button
        type="button"
        onClick={abrirSacola}
        className="pointer-events-auto w-full max-w-[560px] mx-auto bg-primaria text-primaria-texto font-bold text-[15px] h-13 py-3.5 rounded-xl flex items-center justify-between px-5 shadow-lg active:scale-[0.99] transition-transform"
      >
        <span>Ver sacola ({quantidadeTotal})</span>
        <span>{formatarPreco(subtotal)}</span>
      </button>
    </div>
  );
};
