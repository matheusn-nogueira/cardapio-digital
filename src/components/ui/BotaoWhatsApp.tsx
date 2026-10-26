'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { linkWhatsapp } from '@/lib/formatacao';
import { ehRotaDeCompra } from '@/lib/rotas';
import { LogoWhatsApp } from '@/components/checkout/LogosPagamento';

/**
 * Botão redondo do WhatsApp da loja, no canto de baixo à direita (como no MenuDino). Fica acima
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
      className={`fixed right-4 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center active:scale-95 transition-[bottom,transform] duration-200 ${
        comSacola ? 'bottom-[calc(140px+env(safe-area-inset-bottom))]' : 'bottom-[calc(76px+env(safe-area-inset-bottom))]'
      }`}
    >
      <span className="[&_path]:fill-white">
        <LogoWhatsApp className="w-8 h-8" />
      </span>
    </a>
  );
};
