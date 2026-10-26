'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { ehRotaDeCompra } from '@/lib/rotas';

/**
 * Fim da página: só o espaço que as barras fixas de baixo pedem (abas, 64 px, ou abas + "Ver
 * sacola"). O rodapé de site saiu em 26/10/2026; as informações da loja ficam em `SobreLoja`,
 * que abre pelo nome da loja no topo, como num app.
 */
export const Footer: React.FC = () => {
  const pathname = usePathname();
  const { quantidadeTotal } = useCart();
  const hidratado = useHidratado();
  if (ehRotaDeCompra(pathname)) return null;
  return <div aria-hidden="true" className={`max-w-[1100px] mx-auto bg-white ${hidratado && quantidadeTotal > 0 ? 'h-40' : 'h-24'}`} />;
};
