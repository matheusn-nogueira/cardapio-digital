'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { formatarPreco } from '@/lib/formatacao';
import { ehRotaDeCompra } from '@/lib/rotas';
import { usePulo } from '@/lib/toque';


/** Barra "Ver sacola" logo acima da barra de abas (celular e desktop). */
export const FloatingCart: React.FC = () => {
  const { quantidadeTotal, subtotal, abrirSacola, sacolaAberta } = useCart();
  const hidratado = useHidratado();
  const pathname = usePathname();
  const pulo = usePulo(hidratado ? quantidadeTotal : 0);

  if (!hidratado || quantidadeTotal === 0 || sacolaAberta || ehRotaDeCompra(pathname)) return null;

  return (
    <>
    {/* espaço no fim da página do tamanho da barra: o último produto nunca fica atrás dela */}
    <div className="h-[72px]" aria-hidden="true" />
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 px-4 pb-2 z-40 pointer-events-none">
      <button
        type="button"
        onClick={abrirSacola}
        className="pointer-events-auto w-full max-w-[560px] mx-auto bg-primaria text-primaria-texto font-bold text-[15px] h-14 rounded-xl flex items-center justify-between px-5 shadow-lg active:scale-[0.99] transition-transform"
      >
        <span>
          Ver sacola{' '}
          {/* o número pula quando entra item, para a pessoa ver que o toque no + funcionou */}
          <span key={pulo} className={`inline-block tabular-nums ${pulo ? 'animate-pulo' : ''}`}>
            ({quantidadeTotal})
          </span>
        </span>
        <span>{formatarPreco(subtotal)}</span>
      </button>
    </div>
    </>
  );
};
