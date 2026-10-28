'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buscarMapaOfertas, buscarProdutosAtualizados } from '@/lib/api-cliente';
import { criarArmazem, useArmazem } from '@/lib/armazenamento';
import {
  adicionarItem,
  adicionarVariante,
  alterarQuantidade,
  chaveItem,
  contarUnidades,
  ehLegado,
  LinhaCarrinho,
  migrarItens,
  montarLinhas,
  quantidadeNaLinha,
  removerItem,
  unidadesDaLinha,
  validarItensSalvos,
} from '@/lib/carrinho';
import { subtotalCarrinho } from '@/lib/precoQuantidade';
import type { ItemSalvo, Produto } from '@/lib/tipos';
import { vibrarLeve } from '@/lib/toque';
import { useCardapio } from './CardapioContext';

// Só ids e quantidades ficam salvos; nome/preço vêm sempre do catálogo atual
// (assim preço antigo nunca fica preso na sacola). Linha padrão = produto em
// unidades; linha de variante (natural, vasilhame…) = oferta em blocos. Sacolas
// salvas no formato antigo (oferta × blocos) são convertidas ao abrir.
const armazemCarrinho = criarArmazem<ItemSalvo[]>('cdf:carrinho', [], { validar: validarItensSalvos });

interface PrecosConferidos {
  ids: Set<string>;
  mapa: Map<string, Produto>;
}

interface CartContextType {
  linhas: LinhaCarrinho[];
  /** Itens que saíram do cardápio desde que foram adicionados. */
  indisponiveis: number;
  /** Total de unidades na sacola. */
  quantidadeTotal: number;
  /** Subtotal no Pix/dinheiro (preço base, com a combinação mais barata). */
  subtotal: number;
  /** Unidades do produto na sacola, somando a versão padrão e as variantes. */
  unidadesDoProduto: (produtoId: string) => number;
  /** Quantidade na linha (unidades na padrão, blocos na variante). */
  quantidadeNaLinha: (chave: string) => number;
  adicionar: (produtoId: string, unidades?: number) => void;
  adicionarVariante: (produtoId: string, ofertaId: string, blocos?: number) => void;
  alterar: (chave: string, quantidade: number) => void;
  remover: (chave: string) => void;
  removerIndisponiveis: () => void;
  limpar: () => void;
  /** Relê os preços da sacola no banco (sem cache). */
  atualizarPrecos: () => Promise<void>;
  conferindoPrecos: boolean;
  /** Algum preço da sacola mudou em relação ao que a página mostrava. */
  precosMudaram: boolean;
  sacolaAberta: boolean;
  abrirSacola: () => void;
  fecharSacola: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { produtoPorId } = useCardapio();
  const [itens, gravarItens] = useArmazem(armazemCarrinho);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [conferidos, setConferidos] = useState<PrecosConferidos | null>(null);
  const [conferindoPrecos, setConferindoPrecos] = useState(false);
  const [migracaoTentada, setMigracaoTentada] = useState(false);

  // Sacola antiga (por oferta): busca no banco a qual produto/bloco cada oferta
  // pertence e converte para unidades. O que não achar fica como indisponível.
  const temLegado = itens.some(ehLegado);
  useEffect(() => {
    if (!temLegado) return;
    let ativo = true;
    buscarMapaOfertas().then((mapa) => {
      // sem conexão: tenta de novo na próxima visita (não marca nada como indisponível)
      if (!ativo || !mapa) return;
      gravarItens((atual) => migrarItens(atual, mapa));
      setMigracaoTentada(true);
    });
    return () => {
      ativo = false;
    };
  }, [temLegado, gravarItens]);

  // Preço conferido no banco vale para os produtos consultados; o resto vem do catálogo da página.
  const produtoDe = useCallback(
    (id: string) => (conferidos?.ids.has(id) ? conferidos.mapa.get(id) : produtoPorId.get(id)),
    [conferidos, produtoPorId],
  );

  const { linhas, indisponiveis, legados } = useMemo(() => montarLinhas(itens, produtoDe), [itens, produtoDe]);
  const subtotal = useMemo(() => subtotalCarrinho(linhas, false), [linhas]);

  const precosMudaram = useMemo(() => {
    if (!conferidos) return false;
    const daPagina = montarLinhas(itens, (id) => produtoPorId.get(id)).linhas;
    return subtotalCarrinho(daPagina, false) !== subtotal || subtotalCarrinho(daPagina, true) !== subtotalCarrinho(linhas, true);
  }, [conferidos, itens, produtoPorId, subtotal, linhas]);

  const atualizarPrecos = useCallback(async () => {
    const ids = armazemCarrinho
      .ler()
      .flatMap((i) => (i.produtoId ? [i.produtoId] : []));
    if (!ids.length) return;
    setConferindoPrecos(true);
    const atuais = await buscarProdutosAtualizados(ids);
    if (atuais) setConferidos({ ids: new Set(ids), mapa: new Map(atuais.map((p) => [p.id, p])) });
    setConferindoPrecos(false);
  }, []);

  const adicionar = useCallback(
    (produtoId: string, unidades = 1) => {
      vibrarLeve();
      gravarItens((atual) => adicionarItem(atual, produtoId, unidades));
    },
    [gravarItens],
  );
  const adicionarVarianteCb = useCallback(
    (produtoId: string, ofertaId: string, blocos = 1) => {
      vibrarLeve();
      gravarItens((atual) => adicionarVariante(atual, produtoId, ofertaId, blocos));
    },
    [gravarItens],
  );
  const alterar = useCallback(
    (chave: string, quantidade: number) => gravarItens((atual) => alterarQuantidade(atual, chave, quantidade)),
    [gravarItens],
  );
  const remover = useCallback((chave: string) => gravarItens((atual) => removerItem(atual, chave)), [gravarItens]);
  const removerIndisponiveis = useCallback(
    () =>
      gravarItens((atual) => {
        const validas = new Set(montarLinhas(atual, produtoDe).linhas.map((l) => l.chave));
        return atual.filter((i) => !ehLegado(i) && validas.has(chaveItem(i)));
      }),
    [gravarItens, produtoDe],
  );
  const limpar = useCallback(() => gravarItens([]), [gravarItens]);
  const unidadesDoProduto = useCallback(
    (produtoId: string) => linhas.reduce((soma, l) => soma + (l.produto.id === produtoId ? unidadesDaLinha(l) : 0), 0),
    [linhas],
  );
  const quantidadeNaLinhaCb = useCallback((chave: string) => quantidadeNaLinha(itens, chave), [itens]);
  const abrirSacola = useCallback(() => setSacolaAberta(true), []);
  const fecharSacola = useCallback(() => setSacolaAberta(false), []);

  // item antigo só conta como indisponível depois de tentar converter
  const totalIndisponiveis = indisponiveis.length + (migracaoTentada ? legados.length : 0);

  const valor = useMemo(
    () => ({
      linhas,
      indisponiveis: totalIndisponiveis,
      quantidadeTotal: contarUnidades(linhas),
      subtotal,
      unidadesDoProduto,
      quantidadeNaLinha: quantidadeNaLinhaCb,
      adicionar,
      adicionarVariante: adicionarVarianteCb,
      alterar,
      remover,
      removerIndisponiveis,
      limpar,
      atualizarPrecos,
      conferindoPrecos,
      precosMudaram,
      sacolaAberta,
      abrirSacola,
      fecharSacola,
    }),
    [
      linhas,
      totalIndisponiveis,
      subtotal,
      unidadesDoProduto,
      quantidadeNaLinhaCb,
      adicionar,
      adicionarVarianteCb,
      alterar,
      remover,
      removerIndisponiveis,
      limpar,
      atualizarPrecos,
      conferindoPrecos,
      precosMudaram,
      sacolaAberta,
      abrirSacola,
      fecharSacola,
    ],
  );

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error('useCart precisa estar dentro de CartProvider');
  return contexto;
};
