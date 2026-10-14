'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';

/** Barra do topo nas etapas de compra: voltar + nome da loja + etapa. */
export const CabecalhoCheckout: React.FC<{ voltarPara?: string; etapa?: string }> = ({ voltarPara, etapa }) => {
  const { home } = useCardapio();
  return (
    <div className="bg-white h-14 flex items-center justify-center relative border-b border-borda px-14 sticky top-0 z-40">
      {voltarPara && (
        <Link
          href={voltarPara}
          aria-label="Voltar"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-tinta"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
      )}
      <div className="text-center leading-tight min-w-0">
        <Link href="/" className="block text-[15px] font-black truncate">
          {home.loja.nome}
        </Link>
        {etapa && <span className="block text-[12px] text-suave">{etapa}</span>}
      </div>
    </div>
  );
};
