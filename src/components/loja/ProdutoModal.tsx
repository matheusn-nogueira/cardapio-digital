'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { ProdutoDetalhe } from './ProdutoDetalhe';

/** Bottom sheet (celular) / janela (desktop) com o detalhe do produto. */
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
        className="relative w-full sm:max-w-[440px] max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl p-4 pb-6 animate-sobe"
      >
        <div className="sticky top-0 z-10 flex justify-end -mb-10">
          <button
            ref={botaoFechar}
            type="button"
            onClick={fecharProduto}
            aria-label="Fechar"
            className="w-10 h-10 rounded-full bg-white shadow-cartao flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
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
