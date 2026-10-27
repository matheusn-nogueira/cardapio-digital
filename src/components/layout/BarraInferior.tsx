'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { linkWhatsapp } from '@/lib/formatacao';
import { ehRotaDeCompra } from '@/lib/rotas';

/**
 * WhatsApp no mesmo traço dos ícones da barra (desenho vazado do Tabler, MIT, grade de 24 e
 * traço 2 como o lucide), em verde escuro o bastante para o contraste no branco.
 */
const IconeWhatsApp: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

/**
 * Barra de abas fixa no rodapé, como no app do Zé: Início, Busca, Sacola e WhatsApp da loja.
 * O WhatsApp é aba (com nome escrito), não botão flutuante: não cobre produto nem disputa com
 * a barra "Ver sacola" (decisão do dono, 26/10/2026). Fica visível com a sacola aberta, como no app
 * do iFood (dono, 27/10/2026): a sacola para em cima dela.
 */
export const BarraInferior: React.FC = () => {
  const { home } = useCardapio();
  const pathname = usePathname();
  const { quantidadeTotal, abrirSacola, fecharSacola, sacolaAberta } = useCart();
  const hidratado = useHidratado();
  if (ehRotaDeCompra(pathname)) return null;
  const whatsapp = linkWhatsapp(home.config.whatsapp || home.loja.telefone, 'Olá! Vim pelo cardápio online.');

  // com a sacola aberta, a aba ativa é a Sacola
  const naHome = pathname === '/' && !sacolaAberta;
  const naBusca = pathname === '/busca' && !sacolaAberta;
  const item = (ativo: boolean) =>
    `relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[12px] ${ativo ? 'text-tinta font-bold' : 'text-suave font-medium'}`;
  const traco = <span className="absolute bottom-1 w-6 h-[3px] rounded-full bg-tinta" aria-hidden="true" />;

  return (
    <nav
      aria-label="Navegação"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-borda pb-[env(safe-area-inset-bottom)]"
    >
      <div className="h-16 flex max-w-[560px] mx-auto">
        <Link href="/" onClick={fecharSacola} className={item(naHome)} aria-current={naHome ? 'page' : undefined}>
          <Home className="w-6 h-6" aria-hidden="true" />
          Início
          {naHome && traco}
        </Link>
        <Link href="/busca" onClick={fecharSacola} className={item(naBusca)} aria-current={naBusca ? 'page' : undefined}>
          <Search className="w-6 h-6" aria-hidden="true" />
          Busca
          {naBusca && traco}
        </Link>
        <button type="button" onClick={abrirSacola} className={item(sacolaAberta)} aria-expanded={sacolaAberta}>
          <span className="relative">
            <ShoppingBag className="w-6 h-6" aria-hidden="true" />
            {hidratado && quantidadeTotal > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tinta text-white text-[10px] font-bold flex items-center justify-center">
                {quantidadeTotal > 99 ? '99+' : quantidadeTotal}
              </span>
            )}
          </span>
          Sacola
          {sacolaAberta && traco}
        </button>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={item(false)} aria-label="WhatsApp da loja">
            <IconeWhatsApp className="w-6 h-6" />
            WhatsApp
          </a>
        )}
      </div>
    </nav>
  );
};
