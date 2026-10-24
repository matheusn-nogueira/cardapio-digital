'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';

const ROTAS_SEM_BARRA = ['/checkout', '/payment', '/confirmation'];

/** Barra de abas fixa no rodapé, como no app do Zé: Início, Busca e Sacola. */
export const BarraInferior: React.FC = () => {
  const pathname = usePathname();
  const { quantidadeTotal, abrirSacola } = useCart();
  const hidratado = useHidratado();
  if (ROTAS_SEM_BARRA.includes(pathname)) return null;

  const item = (ativo: boolean) =>
    `relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[12px] ${ativo ? 'text-tinta font-bold' : 'text-suave font-medium'}`;
  const traco = <span className="absolute bottom-1 w-6 h-[3px] rounded-full bg-primaria" aria-hidden="true" />;

  return (
    <nav
      aria-label="Navegação"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EFEFEF] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="h-16 flex max-w-[560px] mx-auto">
        <Link href="/" className={item(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
          <Home className="w-6 h-6" aria-hidden="true" />
          Início
          {pathname === '/' && traco}
        </Link>
        <Link href="/busca" className={item(pathname === '/busca')} aria-current={pathname === '/busca' ? 'page' : undefined}>
          <Search className="w-6 h-6" aria-hidden="true" />
          Busca
          {pathname === '/busca' && traco}
        </Link>
        <button type="button" onClick={abrirSacola} className={item(false)}>
          <span className="relative">
            <ShoppingBag className="w-6 h-6" aria-hidden="true" />
            {hidratado && quantidadeTotal > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primaria text-primaria-texto text-[10px] font-bold flex items-center justify-center">
                {quantidadeTotal > 99 ? '99+' : quantidadeTotal}
              </span>
            )}
          </span>
          Sacola
        </button>
      </div>
    </nav>
  );
};
