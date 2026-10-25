'use client';

import React, { useState } from 'react';
import { Bell, Download, Share, SquarePlus, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { instalarApp, useInstalacao } from '@/lib/instalacao';
import { ativarPush, pushSuportado } from '@/lib/push';
import { toastEvent } from '@/components/ui/Toast';

// Banner da home para quem está no NAVEGADOR (no app instalado ele não aparece):
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

export const BannerApp: React.FC = () => {
  const { home } = useCardapio();
  const hidratado = useHidratado();
  const { instalado, podeInstalar, plataforma } = useInstalacao();
  const [fechadoEm, gravarFechado] = useArmazem(armazemBanner);
  const [ocupado, setOcupado] = useState(false);
  const [passos, setPassos] = useState(false);

  if (!hidratado || instalado || Date.now() - fechadoEm < PAUSA_MS) return null;
  const notificacoesAqui = pushSuportado() && Notification.permission === 'default';
  const modo = plataforma === 'ios' ? 'ios' : podeInstalar ? 'instalar' : notificacoesAqui ? 'notificar' : null;
  if (!modo) return null;

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
      toastEvent.show(aceitou ? 'Pronto! Você vai receber nossas promoções.' : 'Tudo bem, sem notificações.');
      if (aceitou && modo === 'notificar') fechar();
    } catch {
      toastEvent.show('Não deu para ativar agora. Tente de novo mais tarde.');
    } finally {
      setOcupado(false);
    }
  };

  const titulo =
    modo === 'notificar' ? 'Receba as promoções no celular' : `Baixe o app da ${home.loja.nome}`;
  const texto =
    modo === 'ios'
      ? 'Abre direto da tela de início e é o único jeito de receber nossas promoções no iPhone.'
      : modo === 'instalar'
        ? 'Abre direto da tela de início, sem procurar o site, e avisa das promoções.'
        : 'Ative as notificações e fique sabendo das ofertas antes de todo mundo.';

  return (
    <section aria-label={titulo} className="px-4 pt-4">
      <div className="relative rounded-2xl bg-tinta text-white p-4 overflow-hidden">
        <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-primaria/20" aria-hidden="true" />
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-2 top-2 w-9 h-9 flex items-center justify-center text-white/70"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative flex gap-3 pr-6">
          <span className="w-12 h-12 rounded-xl bg-primaria text-primaria-texto flex items-center justify-center shrink-0" aria-hidden="true">
            {modo === 'notificar' ? <Bell className="w-6 h-6" /> : <Download className="w-6 h-6" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold leading-tight">{titulo}</h2>
            <p className="text-[13px] text-white/75 mt-1 leading-snug">{texto}</p>
          </div>
        </div>

        {modo === 'ios' && passos && (
          <ol className="relative mt-3 space-y-2 text-[13.5px]">
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-primaria text-primaria-texto text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
              Toque em <Share className="w-4 h-4 inline text-primaria" aria-label="Compartilhar" /> na barra do Safari
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-primaria text-primaria-texto text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
              Escolha <SquarePlus className="w-4 h-4 inline text-primaria" aria-hidden="true" /> <strong>Adicionar à Tela de Início</strong>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-primaria text-primaria-texto text-[12px] font-bold flex items-center justify-center shrink-0">3</span>
              Abra pelo ícone novo e ative as notificações
            </li>
          </ol>
        )}

        <div className="relative flex flex-wrap gap-2 mt-3.5">
          {modo === 'instalar' && (
            <button type="button" onClick={instalar} disabled={ocupado} className="h-10 px-4 rounded-xl bg-primaria text-primaria-texto text-[14px] font-bold disabled:opacity-60">
              Instalar app
            </button>
          )}
          {modo === 'ios' && !passos && (
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
      </div>
    </section>
  );
};
