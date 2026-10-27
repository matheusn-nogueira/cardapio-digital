'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { ProdutoDetalhe } from './ProdutoDetalhe';

/** Bottom sheet (celular) / janela (desktop) com o detalhe do produto, enxuto como no app do Zé. */
export const ProdutoModal: React.FC = () => {
  const { produtoAberto, fecharProduto } = useCardapio();
  const botaoFechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!produtoAberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharProduto();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
      anterior?.focus?.();
    };
  }, [produtoAberto, fecharProduto]);

  if (!produtoAberto) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={fecharProduto} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-produto-modal"
        className="relative w-full sm:max-w-[440px] max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl animate-sobe"
      >
        {/* alça da folha no celular, como nos apps: dá a pista de que ela desce */}
        <span className="absolute left-1/2 -translate-x-1/2 top-2.5 w-12 h-1.5 rounded-full bg-controle sm:hidden" aria-hidden="true" />
        <button
          ref={botaoFechar}
          type="button"
          onClick={fecharProduto}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 w-11 h-11 rounded-full bg-borda flex items-center justify-center"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <ProdutoDetalhe
          key={produtoAberto.id}
          produto={produtoAberto}
          idTitulo="titulo-produto-modal"
          aoAdicionar={fecharProduto}
        />
      </div>
    </div>
  );
};
