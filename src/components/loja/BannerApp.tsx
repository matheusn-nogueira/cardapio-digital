'use client';

import React, { useState } from 'react';
import { Bell, Share, X } from 'lucide-react';
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

/** Botão amarelo dos banners do carrossel (os do ERP e este), no canto de baixo à esquerda. */
export const CLASSE_BOTAO_BANNER =
  'inline-flex items-center h-10 px-4 rounded-xl bg-primaria text-primaria-texto font-condensed font-bold uppercase text-[14px] tracking-[0.06em] disabled:opacity-60';

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

/** Slide no mesmo tamanho dos banners do ERP (h-44), com a mesma arte (botão amarelo no canto de baixo). */
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

  const titulo = modo === 'notificar' ? 'Acompanhe seu pedido' : 'Baixe nosso app';
  const texto =
    modo === 'ios'
      ? 'No iPhone, os avisos do pedido só chegam pelo app.'
      : 'Avisamos quando o pedido sair para entrega.';
  const passo = (n: number, conteudo: React.ReactNode) => (
    <li className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-primaria text-primaria-texto text-[11px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <span>{conteudo}</span>
    </li>
  );

  // Arte no estilo dos banners do Zé (28/10/2026): celular desenhado com o aviso do pedido
  // chegando, título grande em letra condensada e o botão amarelo no canto de baixo.
  return (
    // mesma grade do banner de promoção (BannerCarrossel): 176 px, 16 px de margem, texto no
    // alto e botão embaixo alinhados à esquerda, arte à direita
    <div className="relative flex flex-col w-full h-44 rounded-2xl bg-tinta text-white">
      <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
        <span
          className="absolute -right-10 top-1/2 -translate-y-1/2 w-60 h-60 rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-topo-texto) 40%, transparent) 0%, transparent 68%)' }}
        />
        {!passos && (
          <>
            {/* celular */}
            <span className="absolute right-5 top-5 w-[86px] h-[168px] rounded-[20px] border-[5px] border-white bg-banner rotate-[8deg] flex flex-col items-center pt-4 shadow-[0_10px_20px_rgb(0_0_0/0.35)]">
              <span className="w-7 h-1 rounded-full bg-white/40" />
              {home.loja.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={home.loja.logo_url} alt="" className="w-11 h-11 mt-5 object-contain" />
              ) : (
                <Bell className="w-8 h-8 mt-6 text-white/80" />
              )}
            </span>
            {/* aviso do pedido chegando, por cima do celular */}
            <span className="absolute right-[26px] top-[80px] w-[118px] rounded-xl bg-white text-tinta p-2 -rotate-[4deg] shadow-[0_8px_16px_rgb(0_0_0/0.3)]">
              <span className="flex items-center gap-1 text-[8.5px] text-suave">
                <Bell className="w-2.5 h-2.5" />
                {home.loja.nome} · agora
              </span>
              <span className="block text-[11px] font-bold leading-tight mt-0.5">Pedido #12 saiu para entrega</span>
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-1 top-1 z-20 w-9 h-9 flex items-center justify-center text-white/70"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {passos ? (
        <div className="relative z-10 px-4 pt-4 pr-10">
          <h2 className="font-condensed font-bold uppercase text-[22px] leading-none tracking-[0.04em]">Instale em 3 passos</h2>
          <ol className="mt-2.5 space-y-1.5 text-[13px]">
            {passo(1, <>Toque em <Share className="w-4 h-4 inline text-primaria" aria-label="Compartilhar" /> na barra do Safari</>)}
            {passo(2, <>Escolha <strong>Adicionar à Tela de Início</strong></>)}
            {passo(3, 'Abra pelo ícone novo e ative as notificações')}
          </ol>
        </div>
      ) : (
        <div className="relative z-10 px-4 pt-4 max-w-[52%]">
          <h2 className="font-condensed font-bold uppercase text-[22px] leading-none tracking-[0.04em] text-balance">{titulo}</h2>
          <p className="text-[12px] text-topo-texto leading-[1.35] mt-2 line-clamp-2">{texto}</p>
        </div>
      )}

      {!passos && (
        <div className="relative z-10 mt-auto px-4 pb-4 flex items-center gap-3">
          {modo === 'instalar' && (
            <button type="button" onClick={instalar} disabled={ocupado} className={CLASSE_BOTAO_BANNER}>
              Instalar app
            </button>
          )}
          {modo === 'ios' && (
            <button type="button" onClick={() => setPassos(true)} className={CLASSE_BOTAO_BANNER}>
              Como instalar
            </button>
          )}
          {modo === 'notificar' && (
            <button type="button" onClick={notificar} disabled={ocupado} className={CLASSE_BOTAO_BANNER}>
              Ativar avisos
            </button>
          )}
          {modo === 'instalar' && notificacoesAqui && (
            <button type="button" onClick={notificar} disabled={ocupado} className="link-acao text-[12px] text-white disabled:opacity-60">
              Só os avisos
            </button>
          )}
        </div>
      )}
    </div>
  );
};
