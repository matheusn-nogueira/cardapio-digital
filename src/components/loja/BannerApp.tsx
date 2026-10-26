'use client';

import React, { useState } from 'react';
import { Bell, Download, Share, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { instalarApp, useInstalacao } from '@/lib/instalacao';
import { ativarPush, pushSuportado } from '@/lib/push';
import { toastEvent } from '@/components/ui/Toast';

// Slide do carrossel da home para quem está no NAVEGADOR (no app instalado ele não aparece):
//  - Android com instalação disponível: "Instalar app" (diálogo nativo) e, como
//    alternativa, "Só as notificações" (no Chrome do Android funciona sem instalar);
//  - iPhone: passo a passo do "Adicionar à Tela de Início" (sem isso o iPhone não
//    recebe notificação de site);
//  - outros (computador, Android sem instalação disponível): só as notificações.
// "Fechar" esconde por 7 dias.
const PAUSA_MS = 7 * 24 * 60 * 60 * 1000;
const armazemBanner = criarArmazem<number>('cdf:banner-app', 0, {
  validar: (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0),
});

const fechadoHaPouco = (em: number) => Date.now() - em < PAUSA_MS;

type ModoBanner = 'ios' | 'instalar' | 'notificar';

/** Qual versão do slide mostrar; null = não mostrar (app instalado, fechado há pouco, nada a oferecer). */
export function useModoBannerApp(): ModoBanner | null {
  const hidratado = useHidratado();
  const { instalado, podeInstalar, plataforma } = useInstalacao();
  const [fechadoEm] = useArmazem(armazemBanner);
  if (!hidratado || instalado || fechadoHaPouco(fechadoEm)) return null;
  if (plataforma === 'ios') return 'ios';
  if (podeInstalar) return 'instalar';
  return pushSuportado() && Notification.permission === 'default' ? 'notificar' : null;
}

/** Slide no mesmo tamanho dos banners do ERP (h-44). */
export const SlideApp: React.FC<{ modo: ModoBanner }> = ({ modo }) => {
  const { home } = useCardapio();
  const [, gravarFechado] = useArmazem(armazemBanner);
  const [ocupado, setOcupado] = useState(false);
  const [passos, setPassos] = useState(false);
  const notificacoesAqui = pushSuportado() && Notification.permission === 'default';

  const fechar = () => gravarFechado(Date.now());

  const instalar = async () => {
    setOcupado(true);
    try {
      if (await instalarApp()) toastEvent.show('App instalado! Procure a Casa dos Fundos na sua tela de início.');
    } finally {
      setOcupado(false);
    }
  };

  const notificar = async () => {
    setOcupado(true);
    try {
      const aceitou = await ativarPush();
      toastEvent.show(aceitou ? 'Pronto! Avisamos cada passo do seu pedido.' : 'Tudo bem, sem notificações.');
      if (aceitou && modo === 'notificar') fechar();
    } catch {
      toastEvent.show('Não deu para ativar agora. Tente de novo mais tarde.');
    } finally {
      setOcupado(false);
    }
  };

  const titulo =
    modo === 'notificar' ? 'Acompanhe seu pedido pelo celular' : `Instale o app da ${home.loja.nome}`;
  const texto =
    modo === 'ios'
      ? 'No iPhone, é o único jeito de receber os avisos do seu pedido.'
      : modo === 'instalar'
        ? 'Abre direto da tela de início e avisa quando seu pedido sair.'
        : 'Receba um aviso quando seu pedido sair para entrega.';
  const passo = (n: number, conteudo: React.ReactNode) => (
    <li className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-primaria text-primaria-texto text-[11px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <span>{conteudo}</span>
    </li>
  );

  return (
    <div className="relative h-44 rounded-2xl bg-tinta text-white p-4 overflow-hidden flex flex-col">
      <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-primaria/20" aria-hidden="true" />
      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center text-white/70"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="relative flex gap-3 pr-6">
        <span className="w-11 h-11 rounded-xl bg-primaria text-primaria-texto flex items-center justify-center shrink-0" aria-hidden="true">
          {modo === 'notificar' ? <Bell className="w-5 h-5" /> : <Download className="w-5 h-5" />}
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-tight">{titulo}</h2>
          {!passos && <p className="text-[13px] text-white/75 mt-1 leading-snug">{texto}</p>}
        </div>
      </div>

      {passos ? (
        <ol className="relative mt-2.5 space-y-1.5 text-[13px]">
          {passo(1, <>Toque em <Share className="w-4 h-4 inline text-primaria" aria-label="Compartilhar" /> na barra do Safari</>)}
          {passo(2, <>Escolha <strong>Adicionar à Tela de Início</strong></>)}
          {passo(3, 'Abra pelo ícone novo e ative as notificações')}
        </ol>
      ) : (
        <div className="relative flex flex-wrap gap-2 mt-auto">
          {modo === 'instalar' && (
            <button type="button" onClick={instalar} disabled={ocupado} className="h-10 px-4 rounded-xl bg-primaria text-primaria-texto text-[14px] font-bold disabled:opacity-60">
              Instalar app
            </button>
          )}
          {modo === 'ios' && (
            <button type="button" onClick={() => setPassos(true)} className="h-10 px-4 rounded-xl bg-primaria text-primaria-texto text-[14px] font-bold">
              Como instalar
            </button>
          )}
          {(modo === 'notificar' || (modo === 'instalar' && notificacoesAqui)) && (
            <button
              type="button"
              onClick={notificar}
              disabled={ocupado}
              className={`h-10 px-4 rounded-xl text-[14px] font-bold disabled:opacity-60 ${
                modo === 'notificar' ? 'bg-primaria text-primaria-texto' : 'bg-white/10 text-white'
              }`}
            >
              {modo === 'notificar' ? 'Ativar notificações' : 'Só as notificações'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
