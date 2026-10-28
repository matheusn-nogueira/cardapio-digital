'use client';

import React, { useEffect } from 'react';
import { registrarEtapa } from '@/lib/medicao';
import type { StatusLoja } from '@/lib/horarios';
import type { DadosHome, Produto } from '@/lib/tipos';
import { CardapioProvider } from './CardapioContext';
import { CartProvider } from './CartContext';

export const AppProviders: React.FC<{
  home: DadosHome;
  status: StatusLoja;
  produtos: Produto[];
  esgotados: Produto[];
  children: React.ReactNode;
}> = ({ home, status, produtos, esgotados, children }) => {
  useEffect(() => registrarEtapa('visita'), []);
  return (
    <CardapioProvider home={home} status={status} produtos={produtos} esgotados={esgotados}>
      <CartProvider>{children}</CartProvider>
    </CardapioProvider>
  );
};
