'use client';

import React from 'react';
import type { Produto } from '@/lib/tipos';
import { ProdutoCard } from './ProdutoCard';

export const GradeProdutos: React.FC<{ produtos: Produto[] }> = ({ produtos }) => (
  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {produtos.map((produto, i) => (
      <li key={produto.id} className="flex">
        {/* as 4 primeiras aparecem na primeira tela do celular: foto com prioridade */}
        <ProdutoCard produto={produto} prioridade={i < 4} />
      </li>
    ))}
  </ul>
);
