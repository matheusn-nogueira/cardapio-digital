'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';

const TOTAL_ETAPAS = 3;

/** Barra do topo nas etapas de compra, azul-noite como o topo da loja (Freezer): voltar + nome da loja + etapa, com o progresso embaixo. */
export const CabecalhoCheckout: React.FC<{ voltarPara?: string; etapa?: string; etapaAtual?: number }> = ({
  voltarPara,
  etapa,
  etapaAtual,
}) => {
  const { home } = useCardapio();
  return (
    <div className="bg-topo text-white sticky top-0 z-40">
      <div className="h-14 flex items-center justify-center relative px-14">
        {voltarPara && (
          <Link
            href={voltarPara}
            aria-label="Voltar"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
        )}
        <div className="text-center leading-tight min-w-0">
          <Link href="/" className="block font-condensed text-[18px] font-extrabold uppercase truncate">
            {home.loja.nome}
          </Link>
          {etapa && <span className="block text-[12px] font-semibold text-topo-texto">{etapa}</span>}
        </div>
      </div>
      {etapaAtual != null && (
        <div className="flex gap-1.5 px-4 pb-3 max-w-[560px] mx-auto" aria-hidden="true">
          {Array.from({ length: TOTAL_ETAPAS }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i < etapaAtual ? 'bg-primaria' : 'bg-white/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
};
