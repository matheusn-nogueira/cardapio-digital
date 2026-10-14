'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { criarArmazem, useArmazem } from '@/lib/armazenamento';
import {
  adicionarItem,
  alterarQuantidade,
  calcularSubtotal,
  contarItens,
  LinhaCarrinho,
  montarLinhas,
  validarItensSalvos,
} from '@/lib/carrinho';
import type { ItemCarrinho } from '@/lib/tipos';
import { useCardapio } from './CardapioContext';

// Só ids de oferta + quantidade ficam salvos; nome/preço vêm sempre do
// catálogo atual (assim preço antigo nunca fica preso no carrinho).
const armazemCarrinho = criarArmazem<ItemCarrinho[]>('cdf:carrinho', [], { validar: validarItensSalvos });

interface CartContextType {
  itens: ItemCarrinho[];
  linhas: LinhaCarrinho[];
  /** Itens que saíram do cardápio desde que foram adicionados. */
  indisponiveis: ItemCarrinho[];
  quantidadeTotal: number;
  /** Subtotal no Pix/dinheiro (preço base). */
  subtotal: number;
  quantidadeDaOferta: (ofertaId: string) => number;
  adicionar: (ofertaId: string, quantidade?: number) => void;
  alterar: (ofertaId: string, quantidade: number) => void;
  remover: (ofertaId: string) => void;
  removerIndisponiveis: () => void;
  limpar: () => void;
  sacolaAberta: boolean;
  abrirSacola: () => void;
  fecharSacola: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { indiceOfertas } = useCardapio();
  const [itens, gravarItens] = useArmazem(armazemCarrinho);
  const [sacolaAberta, setSacolaAberta] = useState(false);

  const { linhas, indisponiveis } = useMemo(() => montarLinhas(itens, indiceOfertas), [itens, indiceOfertas]);

  const adicionar = useCallback(
    (ofertaId: string, quantidade = 1) => gravarItens((atual) => adicionarItem(atual, ofertaId, quantidade)),
    [gravarItens],
  );
  const alterar = useCallback(
    (ofertaId: string, quantidade: number) => gravarItens((atual) => alterarQuantidade(atual, ofertaId, quantidade)),
    [gravarItens],
  );
  const remover = useCallback(
    (ofertaId: string) => gravarItens((atual) => atual.filter((i) => i.ofertaId !== ofertaId)),
    [gravarItens],
  );
  const removerIndisponiveis = useCallback(
    () => gravarItens((atual) => atual.filter((i) => indiceOfertas.has(i.ofertaId))),
    [gravarItens, indiceOfertas],
  );
  const limpar = useCallback(() => gravarItens([]), [gravarItens]);
  const quantidadeDaOferta = useCallback(
    (ofertaId: string) => itens.find((i) => i.ofertaId === ofertaId)?.quantidade ?? 0,
    [itens],
  );
  const abrirSacola = useCallback(() => setSacolaAberta(true), []);
  const fecharSacola = useCallback(() => setSacolaAberta(false), []);

  const valor = useMemo(
    () => ({
      itens,
      linhas,
      indisponiveis,
      quantidadeTotal: contarItens(linhas.map((l) => l.item)),
      subtotal: calcularSubtotal(linhas, 'pix'),
      quantidadeDaOferta,
      adicionar,
      alterar,
      remover,
      removerIndisponiveis,
      limpar,
      sacolaAberta,
      abrirSacola,
      fecharSacola,
    }),
    [itens, linhas, indisponiveis, quantidadeDaOferta, adicionar, alterar, remover, removerIndisponiveis, limpar, sacolaAberta, abrirSacola, fecharSacola],
  );

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error('useCart precisa estar dentro de CartProvider');
  return contexto;
};
