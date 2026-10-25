'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Bike, Percent, Tag, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { appInstalado, ativarPush, pushSuportado, salvarInscricao } from '@/lib/push';
import { armazemIdade } from '@/components/loja/ConfirmacaoIdade';
import { toastEvent } from './Toast';

// Convite para ativar as notificações, em folha que sobe do rodapé:
//  - na confirmação do pedido (momento em que a pessoa já confia na loja);
//  - na home, depois de 25 s, para quem abriu o cardápio instalado na tela de início.
// "Agora não" esconde por 14 dias; quem aceitou ou bloqueou não vê mais.
const PAUSA_MS = 14 * 24 * 60 * 60 * 1000;
const ESPERA_HOME_MS = 25_000;

const armazemConvite = criarArmazem<number>('cdf:convite-push', 0, {
  validar: (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0),
});

const BENEFICIOS = [
  { icone: Percent, texto: 'Ofertas relâmpago antes de todo mundo' },
  { icone: Tag, texto: 'Cupons exclusivos para quem ativa' },
  { icone: Bike, texto: 'Aviso quando seu pedido sair para entrega' },
];

export const ConvitePush: React.FC = () => {
  const pathname = usePathname();
  const { home } = useCardapio();
  const hidratado = useHidratado();
  const [dispensadoEm, gravarDispensado] = useArmazem(armazemConvite);
  const [maiorDeIdade] = useArmazem(armazemIdade);
  const [visivel, setVisivel] = useState(false);
  const [ativando, setAtivando] = useState(false);

  // quem já permitiu: regrava a inscrição a cada abertura (cobre uma gravação que falhou antes)
  useEffect(() => {
    if (pushSuportado() && Notification.permission === 'granted') salvarInscricao().catch(() => {});
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
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={dispensar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-convite-push"
        className="relative w-full sm:max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden animate-sobe pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={dispensar}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-tinta"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="relative bg-primaria px-6 pt-8 pb-7 text-center overflow-hidden">
          <span className="absolute -left-10 -bottom-12 w-36 h-36 rounded-full bg-white/15" aria-hidden="true" />
          <span className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/15" aria-hidden="true" />
          <span className="relative mx-auto w-20 h-20 rounded-full bg-tinta text-primaria flex items-center justify-center shadow-lg" aria-hidden="true">
            <Bell className="w-10 h-10 origin-top animate-[balanca_1.2s_ease-in-out_2]" strokeWidth={2.2} />
          </span>
          <h2 id="titulo-convite-push" className="relative mt-4 font-condensed font-bold uppercase text-[30px] leading-[0.95] text-tinta">
            {naConfirmacao ? 'Acompanhe seu pedido' : 'Não perca nenhuma promoção'}
          </h2>
          <p className="relative mt-1.5 text-[14px] font-medium text-tinta/80">Ative as notificações da {home.loja.nome}</p>
        </div>

        <ul className="px-6 pt-5 space-y-3">
          {BENEFICIOS.map(({ icone: Icone, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-[15px] text-tinta">
              <span className="w-9 h-9 rounded-xl bg-bloco flex items-center justify-center shrink-0" aria-hidden="true">
                <Icone className="w-[18px] h-[18px]" />
              </span>
              {texto}
            </li>
          ))}
        </ul>

        <div className="px-6 pt-5 pb-5">
          <button
            type="button"
            onClick={ativar}
            disabled={ativando}
            className="w-full h-14 rounded-xl bg-tinta text-white font-condensed font-bold uppercase text-[20px] disabled:opacity-60"
          >
            {ativando ? 'Ativando…' : 'Quero receber'}
          </button>
          <button type="button" onClick={dispensar} className="w-full h-11 mt-1 text-[14px] font-bold text-suave">
            Agora não
          </button>
          <p className="text-[11px] text-suave text-center">Só mandamos o que vale a pena. Dá para desligar quando quiser.</p>
        </div>
      </div>
    </div>
  );
};
