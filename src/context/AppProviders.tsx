'use client';

import React from 'react';
import type { StatusLoja } from '@/lib/horarios';
import type { DadosHome, Produto } from '@/lib/tipos';
import { CardapioProvider } from './CardapioContext';
import { CartProvider } from './CartContext';

export const AppProviders: React.FC<{
  home: DadosHome;
  status: StatusLoja;
  produtos: Produto[];
  children: React.ReactNode;
}> = ({ home, status, produtos, children }) => {
  return (
    <CardapioProvider home={home} status={status} produtos={produtos}>
      <CartProvider>{children}</CartProvider>
    </CardapioProvider>
  );
};
