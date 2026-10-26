'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// Campos do checkout: altos (48 px) e com letra de 17 px, para quem tem pouca prática no
// celular; o título fica acima da caixa e o erro logo embaixo, em vermelho.
export const classeCampo =
  'w-full h-12 px-3.5 border border-borda rounded-xl text-[17px] text-tinta bg-white outline-none focus:border-tinta focus:ring-2 focus:ring-primaria/40 aria-[invalid=true]:border-perigo';

export const Campo: React.FC<{
  id: string;
  rotulo: string;
  opcional?: boolean;
  erro?: string | null;
  ajuda?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, rotulo, opcional, erro, ajuda, children, className }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-[15px] font-bold text-tinta mb-1.5">
      {rotulo} {opcional && <span className="text-suave font-normal text-[14px]">(opcional)</span>}
    </label>
    {children}
    {erro ? (
      <p id={`${id}-erro`} className="text-[14px] text-perigo mt-1.5 font-medium">
        {erro}
      </p>
    ) : (
      ajuda && <p className="text-[13px] text-suave mt-1.5">{ajuda}</p>
    )}
  </div>
);

/** Botão da etapa, fixo embaixo da tela (ao alcance do polegar). A página reserva pb-32. */
export const BarraDaEtapa: React.FC<{
  rotulo: string;
  aoTocar: () => void;
  carregando?: boolean;
  rotuloCarregando?: string;
  children?: React.ReactNode;
}> = ({ rotulo, aoTocar, carregando, rotuloCarregando, children }) => (
  <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#EFEFEF] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div className="max-w-[560px] mx-auto">
      {children}
      <button
        type="button"
        onClick={aoTocar}
        disabled={carregando}
        className="w-full h-14 rounded-xl bg-primaria text-primaria-texto text-[17px] font-black flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-80"
      >
        {carregando && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
        {carregando ? rotuloCarregando ?? rotulo : rotulo}
      </button>
    </div>
  </div>
);
