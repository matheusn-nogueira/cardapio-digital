'use client';

import React from 'react';
import type { Produto } from '@/lib/tipos';
import { ProdutoCard } from './ProdutoCard';

export const GradeProdutos: React.FC<{ produtos: Produto[] }> = ({ produtos }) => (
  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {produtos.map((produto) => (
      <li key={produto.id} className="flex">
        <ProdutoCard produto={produto} />
      </li>
    ))}
  </ul>
);
