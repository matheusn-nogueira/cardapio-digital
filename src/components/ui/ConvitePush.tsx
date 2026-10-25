'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { appInstalado, ativarPush, pushSuportado, registrarServiceWorker } from '@/lib/push';
import { armazemIdade } from '@/components/loja/ConfirmacaoIdade';
import { toastEvent } from './Toast';

// Convite discreto para ativar as notificações, acima da barra de abas:
//  - na confirmação do pedido (momento em que a pessoa já confia na loja);
//  - na home, depois de 25 s, para quem abriu o cardápio instalado na tela de início.
// "Agora não" esconde por 14 dias; quem aceitou ou bloqueou não vê mais.
const PAUSA_MS = 14 * 24 * 60 * 60 * 1000;
const ESPERA_HOME_MS = 25_000;

const armazemConvite = criarArmazem<number>('cdf:convite-push', 0, {
  validar: (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0),
});

export const ConvitePush: React.FC = () => {
  const pathname = usePathname();
  const { home } = useCardapio();
  const hidratado = useHidratado();
  const [dispensadoEm, gravarDispensado] = useArmazem(armazemConvite);
  const [maiorDeIdade] = useArmazem(armazemIdade);
  const [visivel, setVisivel] = useState(false);
  const [ativando, setAtivando] = useState(false);

  // quem já aceitou: mantém o service worker registrado (renova a inscrição sozinho)
  useEffect(() => {
    if (pushSuportado() && Notification.permission === 'granted') registrarServiceWorker().catch(() => {});
  }, []);

  const naConfirmacao = pathname === '/confirmation';
  const naHome = pathname === '/';
  useEffect(() => {
    if (!hidratado || !pushSuportado() || Notification.permission !== 'default') return;
    if (home.config.pedir_confirmacao_idade && !maiorDeIdade) return;
    if (Date.now() - dispensadoEm < PAUSA_MS) return;
    if (naConfirmacao) {
      const relogio = setTimeout(() => setVisivel(true), 1500);
      return () => clearTimeout(relogio);
    }
    if (naHome && appInstalado()) {
      const relogio = setTimeout(() => setVisivel(true), ESPERA_HOME_MS);
      return () => clearTimeout(relogio);
    }
  }, [hidratado, maiorDeIdade, dispensadoEm, naConfirmacao, naHome, home.config.pedir_confirmacao_idade]);

  if (!visivel) return null;

  const dispensar = () => {
    gravarDispensado(Date.now());
    setVisivel(false);
  };

  const ativar = async () => {
    setAtivando(true);
    try {
      const aceitou = await ativarPush();
      toastEvent.show(aceitou ? 'Pronto! Você vai receber nossas promoções.' : 'Tudo bem, sem notificações.');
      if (!aceitou) gravarDispensado(Date.now());
    } catch {
      toastEvent.show('Não deu para ativar agora. Tente de novo mais tarde.');
      gravarDispensado(Date.now());
    } finally {
      setAtivando(false);
      setVisivel(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="titulo-convite-push"
      className={`fixed left-0 right-0 z-[60] px-4 animate-sobe ${
        naConfirmacao ? 'bottom-[max(16px,env(safe-area-inset-bottom))]' : 'bottom-[calc(72px+env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="max-w-[560px] mx-auto bg-white rounded-2xl shadow-xl border border-[#EFEFEF] p-4 flex gap-3">
        <span className="w-11 h-11 rounded-full bg-primaria text-primaria-texto flex items-center justify-center shrink-0" aria-hidden="true">
          <Bell className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p id="titulo-convite-push" className="text-[15px] font-bold text-tinta leading-tight">
            {naConfirmacao ? 'Quer saber quando seu pedido sair e das promoções?' : 'Quer receber as promoções da loja?'}
          </p>
          <p className="text-[13px] text-suave mt-0.5">Avisamos pelo celular. Dá para desligar quando quiser.</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={ativar}
              disabled={ativando}
              className="h-10 px-4 rounded-xl bg-primaria text-primaria-texto text-[14px] font-bold disabled:opacity-60"
            >
              {ativando ? 'Ativando…' : 'Ativar notificações'}
            </button>
            <button type="button" onClick={dispensar} className="h-10 px-3 rounded-xl text-[14px] font-bold text-suave">
              Agora não
            </button>
          </div>
        </div>
        <button type="button" onClick={dispensar} aria-label="Fechar" className="w-8 h-8 -mr-1 -mt-1 flex items-center justify-center text-suave shrink-0">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
