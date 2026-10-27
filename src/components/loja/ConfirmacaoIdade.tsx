'use client';

import React, { useState } from 'react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';

/** Confirmação de idade lembrada no navegador (os pop-ups de promoção esperam por ela). */
export const armazemIdade = criarArmazem<boolean>('cdf:maior-de-18', false, { validar: (v) => v === true });

/** Pergunta a idade na primeira visita (se a loja pedir) e lembra a resposta. */
export const ConfirmacaoIdade: React.FC = () => {
  const { home } = useCardapio();
  const hidratado = useHidratado();
  const [confirmado, gravarConfirmado] = useArmazem(armazemIdade);
  const [recusou, setRecusou] = useState(false);

  if (!hidratado || !home.config.pedir_confirmacao_idade || confirmado) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-tinta/95 flex items-center justify-center p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-idade"
        aria-describedby="texto-idade"
        className="bg-white rounded-2xl p-6 w-full max-w-[380px] text-center animate-sobe"
      >
        <div
          className="mx-auto w-16 h-16 rounded-full bg-primaria text-primaria-texto flex items-center justify-center text-[22px] font-black tracking-tight"
          aria-hidden="true"
        >
          18+
        </div>
        {recusou ? (
          <>
            <h2 id="titulo-idade" className="text-[20px] font-black mt-2">
              Volte quando fizer 18!
            </h2>
            <p id="texto-idade" className="text-[14px] text-suave mt-2">
              A venda de bebidas alcoólicas é proibida para menores de 18 anos.
            </p>
            <button
              type="button"
              onClick={() => setRecusou(false)}
              className="mt-5 w-full h-12 rounded-xl border-2 border-tinta font-bold text-[15px]"
            >
              Voltar
            </button>
          </>
        ) : (
          <>
            <h2 id="titulo-idade" className="text-[20px] font-black mt-2">
              Você tem 18 anos ou mais?
            </h2>
            <p id="texto-idade" className="text-[14px] text-suave mt-2">
              {home.loja.nome} vende bebidas alcoólicas. Para continuar, confirme sua idade.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                autoFocus
                onClick={() => gravarConfirmado(true)}
                className="w-full h-12 rounded-xl bg-primaria text-primaria-texto font-bold text-[15px]"
              >
                Sim, tenho 18 anos ou mais
              </button>
              <button
                type="button"
                onClick={() => setRecusou(true)}
                className="w-full h-12 rounded-xl border-2 border-borda font-bold text-[15px] text-tinta"
              >
                Não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
