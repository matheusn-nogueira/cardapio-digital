'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { descreverStatus, type StatusLoja } from '@/lib/horarios';
import { useMinutoAtual } from '@/lib/relogio';
import type { Categoria, DadosHome, Produto } from '@/lib/tipos';

interface CardapioContextType {
  home: DadosHome;
  status: StatusLoja;
  produtos: Produto[];
  produtoPorId: Map<string, Produto>;
  /** categoria do produto (ex.: "Cerveja") → categoria do cardápio */
  categoriaDoProduto: (produto: Produto) => Categoria | undefined;
  produtoAberto: Produto | null;
  abrirProduto: (id: string) => void;
  fecharProduto: () => void;
}

const CardapioContext = createContext<CardapioContextType | undefined>(undefined);

export const CardapioProvider: React.FC<{
  home: DadosHome;
  status: StatusLoja;
  produtos: Produto[];
  children: React.ReactNode;
}> = ({ home, status, produtos, children }) => {
  const [produtoAbertoId, setProdutoAbertoId] = useState<string | null>(null);

  // "Fecha em 3h 24min" precisa andar: o status do servidor vale na hidratação; depois recalcula a cada minuto.
  const minuto = useMinutoAtual();
  const statusAoVivo = useMemo(
    () => (minuto == null ? status : descreverStatus(home.aberta, home.config, home.horarios)),
    [minuto, status, home.aberta, home.config, home.horarios],
  );

  const produtoPorId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const categoriaPorNome = useMemo(() => {
    const mapa = new Map<string, Categoria>();
    for (const c of home.categorias) for (const nome of c.categorias_produto) if (!mapa.has(nome)) mapa.set(nome, c);
    return mapa;
  }, [home.categorias]);

  const categoriaDoProduto = useCallback((p: Produto) => categoriaPorNome.get(p.categoria), [categoriaPorNome]);
  const abrirProduto = useCallback((id: string) => setProdutoAbertoId(id), []);
  const fecharProduto = useCallback(() => setProdutoAbertoId(null), []);

  const valor = useMemo(
    () => ({
      home,
      status: statusAoVivo,
      produtos,
      produtoPorId,
      categoriaDoProduto,
      produtoAberto: produtoAbertoId ? produtoPorId.get(produtoAbertoId) ?? null : null,
      abrirProduto,
      fecharProduto,
    }),
    [home, statusAoVivo, produtos, produtoPorId, categoriaDoProduto, produtoAbertoId, abrirProduto, fecharProduto],
  );

  return <CardapioContext.Provider value={valor}>{children}</CardapioContext.Provider>;
};

export const useCardapio = () => {
  const contexto = useContext(CardapioContext);
  if (!contexto) throw new Error('useCardapio precisa estar dentro de CardapioProvider');
  return contexto;
};
