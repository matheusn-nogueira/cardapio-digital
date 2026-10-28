'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Bike, Check, Share, SquarePlus, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { armazemUltimoPedido } from '@/lib/estado-checkout';
import { useInstalacao } from '@/lib/instalacao';
import { ativarPush, pushSuportado, salvarInscricao, vincularPedido } from '@/lib/push';
import { armazemIdade } from '@/components/loja/ConfirmacaoIdade';
import { toastEvent } from './Toast';

// Convite para ativar as notificações, em folha que sobe do rodapé:
//  - na confirmação do pedido (momento em que a pessoa já confia na loja); no iPhone
//    pelo navegador, onde push não existe, vira o passo a passo de instalar o app;
//  - na home do app instalado: 3 s na primeira abertura, 25 s nas seguintes.
// "Agora não" esconde por 14 dias; quem aceitou ou bloqueou não vê mais.
const PAUSA_MS = 14 * 24 * 60 * 60 * 1000;
const ESPERA_HOME_MS = 25_000;
const ESPERA_PRIMEIRA_MS = 3_000;

const armazemConvite = criarArmazem<number>('cdf:convite-push', 0, {
  validar: (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0),
});
// true até a primeira vez que o convite é oferecido no app instalado
const armazemPrimeiraAbertura = criarArmazem<boolean>('cdf:primeira-abertura-app', true, {
  validar: (v) => v !== false,
});

/** Folha para iPhone no navegador: instalar é o único caminho para receber os avisos. */
const ConviteInstalarIphone: React.FC<{ nomeLoja: string; aoFechar: () => void }> = ({ nomeLoja, aoFechar }) => (
  <div className="fixed inset-0 z-[160] flex items-end justify-center">
    <div className="absolute inset-0 bg-tinta/45 backdrop-blur-[3px] animate-fade-in" onClick={aoFechar} aria-hidden="true" />
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-convite-iphone"
      className="relative w-full bg-white rounded-t-3xl overflow-hidden animate-sobe pb-[env(safe-area-inset-bottom)]"
    >
      <button type="button" onClick={aoFechar} aria-label="Fechar" className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-tinta">
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      <div className="bg-primaria px-6 pt-8 pb-6 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-tinta text-primaria flex items-center justify-center" aria-hidden="true">
          <Bike className="w-8 h-8" />
        </span>
        <h2 id="titulo-convite-iphone" className="mt-3 font-condensed font-bold uppercase text-[28px] leading-[0.95] text-tinta">
          Quer saber quando seu pedido sair?
        </h2>
        <p className="mt-1.5 text-[14px] font-medium text-tinta/80">No iPhone, os avisos chegam pelo app da {nomeLoja}. Leva 10 segundos:</p>
      </div>
      <ol className="px-6 pt-5 space-y-3 text-[15px] text-tinta">
        <li className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-tinta text-white text-[14px] font-bold flex items-center justify-center shrink-0">1</span>
          Toque em <Share className="w-5 h-5 inline" aria-label="Compartilhar" /> na barra do Safari
        </li>
        <li className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-tinta text-white text-[14px] font-bold flex items-center justify-center shrink-0">2</span>
          <span>
            Escolha <SquarePlus className="w-5 h-5 inline" aria-hidden="true" /> <strong>Adicionar à Tela de Início</strong>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-tinta text-white text-[14px] font-bold flex items-center justify-center shrink-0">3</span>
          Abra pelo ícone novo e toque em Quero receber
        </li>
      </ol>
      <div className="px-6 pt-5 pb-5">
        <button type="button" onClick={aoFechar} className="w-full h-12 rounded-xl bg-tinta text-white text-[16px] font-bold">
          Entendi
        </button>
      </div>
    </div>
  </div>
);

const BENEFICIOS = [
  // a notificação é para acompanhar o pedido (dono, 26/10/2026): nada de prometer oferta ou cupom
  { icone: Check, texto: 'Aviso quando a loja começar a separar seu pedido' },
  { icone: Bike, texto: 'Aviso quando ele sair para entrega' },
  { icone: Bell, texto: 'Sem precisar ficar abrindo o WhatsApp' },
];

export const ConvitePush: React.FC = () => {
  const pathname = usePathname();
  const { home } = useCardapio();
  const hidratado = useHidratado();
  const [dispensadoEm, gravarDispensado] = useArmazem(armazemConvite);
  const [maiorDeIdade] = useArmazem(armazemIdade);
  const [visivel, setVisivel] = useState(false);
  const [ativando, setAtivando] = useState(false);

  const [pedido] = useArmazem(armazemUltimoPedido);
  const [primeiraAbertura, gravarPrimeiraAbertura] = useArmazem(armazemPrimeiraAbertura);
  const { instalado, plataforma } = useInstalacao();

  // quem já permitiu: regrava a inscrição a cada abertura (cobre uma gravação que falhou antes)
  useEffect(() => {
    if (pushSuportado() && Notification.permission === 'granted') salvarInscricao().catch(() => {});
  }, []);

  const naConfirmacao = pathname === '/confirmation';
  const naHome = pathname === '/';
  const pedidoId = naConfirmacao ? pedido?.pedidoId : undefined;

  // com permissão dada, o pedido recém-feito já fica ligado aos avisos de status
  useEffect(() => {
    if (!pedidoId || !pushSuportado() || Notification.permission !== 'granted') return;
    salvarInscricao()
      .then(() => vincularPedido(pedidoId))
      .catch(() => {});
  }, [pedidoId]);

  // iPhone no navegador não recebe push: na confirmação, o convite vira "instale o app"
  const iphoneNoNavegador = plataforma === 'ios' && !instalado;

  useEffect(() => {
    if (!hidratado) return;
    if (home.config.pedir_confirmacao_idade && !maiorDeIdade) return;
    if (Date.now() - dispensadoEm < PAUSA_MS) return;
    const podePerguntar = pushSuportado() && Notification.permission === 'default';
    if (naConfirmacao && (podePerguntar || iphoneNoNavegador)) {
      const relogio = setTimeout(() => setVisivel(true), 1500);
      return () => clearTimeout(relogio);
    }
    if (naHome && instalado && podePerguntar) {
      // primeira abertura do app instalado: a pessoa acabou de escolher instalar, pergunta logo
      const espera = primeiraAbertura ? ESPERA_PRIMEIRA_MS : ESPERA_HOME_MS;
      const relogio = setTimeout(() => {
        setVisivel(true);
        gravarPrimeiraAbertura(false);
      }, espera);
      return () => clearTimeout(relogio);
    }
  }, [
    hidratado,
    maiorDeIdade,
    dispensadoEm,
    naConfirmacao,
    naHome,
    instalado,
    iphoneNoNavegador,
    primeiraAbertura,
    gravarPrimeiraAbertura,
    home.config.pedir_confirmacao_idade,
  ]);

  if (!visivel) return null;
  if (iphoneNoNavegador) return <ConviteInstalarIphone nomeLoja={home.loja.nome} aoFechar={() => {
    gravarDispensado(Date.now());
    setVisivel(false);
  }} />;

  const dispensar = () => {
    gravarDispensado(Date.now());
    setVisivel(false);
  };

  const ativar = async () => {
    setAtivando(true);
    try {
      const aceitou = await ativarPush();
      if (aceitou && pedidoId) await vincularPedido(pedidoId).catch(() => {});
      toastEvent.show(
        aceitou
          ? pedidoId
            ? 'Pronto! Avisamos quando seu pedido sair.'
            : 'Pronto! Avisamos cada passo do seu próximo pedido.'
          : 'Tudo bem, sem notificações.',
      );
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
      <div className="absolute inset-0 bg-tinta/45 backdrop-blur-[3px] animate-fade-in" onClick={dispensar} aria-hidden="true" />
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
          className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-tinta"
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
            {naConfirmacao ? 'Acompanhe seu pedido' : 'Acompanhe seus pedidos'}
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
          <p className="text-[12px] text-suave text-center">Só avisamos sobre os seus pedidos. Dá para desligar quando quiser.</p>
        </div>
      </div>
    </div>
  );
};
