'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { linkWhatsapp } from '@/lib/formatacao';
import { ehRotaDeCompra } from '@/lib/rotas';

/**
 * Botão do WhatsApp da loja com o ícone oficial do aplicativo (balão verde de borda branca,
 * public/whatsapp.svg, do Wikimedia Commons), no canto de baixo à direita, como no MenuDino. Fica acima
 * da barra de abas (64 px) e sobe junto quando a barra "Ver sacola" aparece. Some nas etapas
 * de compra e com a sacola aberta.
 */
export const BotaoWhatsApp: React.FC = () => {
  const { home } = useCardapio();
  const { quantidadeTotal, sacolaAberta } = useCart();
  const hidratado = useHidratado();
  const pathname = usePathname();
  const link = linkWhatsapp(home.config.whatsapp || home.loja.telefone, 'Olá! Vim pelo cardápio online.');
  if (!link || sacolaAberta || ehRotaDeCompra(pathname)) return null;
  const comSacola = hidratado && quantidadeTotal > 0;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a loja pelo WhatsApp"
      className={`fixed right-3 z-40 w-16 h-16 flex items-center justify-center active:scale-95 transition-[bottom,transform] duration-200 [filter:drop-shadow(0_3px_6px_rgba(0,0,0,.25))] ${
        comSacola ? 'bottom-[calc(140px+env(safe-area-inset-bottom))]' : 'bottom-[calc(76px+env(safe-area-inset-bottom))]'
      }`}
    >
      {/* svg estático: <img> simples, sem otimizador */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/whatsapp.svg" alt="" className="w-full h-full" />
    </a>
  );
};
