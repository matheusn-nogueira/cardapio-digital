// Contas do carrinho (subtotal, mínimo, frete grátis). Módulo puro.
// O banco recalcula tudo em `cardapio_criar_pedido`; aqui é só para exibir.
import type { FormaPagamento, ItemCarrinho, Oferta, Produto } from './tipos';
import { precoOferta } from './ofertas';

export const QUANTIDADE_MAXIMA = 999;

export interface LinhaCarrinho {
  item: ItemCarrinho;
  produto: Produto;
  oferta: Oferta;
}

export type IndiceOfertas = Map<string, { produto: Produto; oferta: Oferta }>;

export function indexarOfertas(produtos: Produto[]): IndiceOfertas {
  const indice: IndiceOfertas = new Map();
  for (const produto of produtos) {
    for (const oferta of produto.ofertas) indice.set(oferta.id, { produto, oferta });
  }
  return indice;
}

/** Separa o que ainda existe no cardápio do que saiu (oferta desativada, produto oculto…). */
export function montarLinhas(itens: ItemCarrinho[], indice: IndiceOfertas) {
  const linhas: LinhaCarrinho[] = [];
  const indisponiveis: ItemCarrinho[] = [];
  for (const item of itens) {
    const achado = indice.get(item.ofertaId);
    if (achado) linhas.push({ item, ...achado });
    else indisponiveis.push(item);
  }
  return { linhas, indisponiveis };
}

export function calcularSubtotal(linhas: LinhaCarrinho[], forma: FormaPagamento | null | undefined): number {
  const total = linhas.reduce((soma, l) => soma + precoOferta(l.oferta, forma) * l.item.quantidade, 0);
  return arredondar(total);
}

export function contarItens(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0);
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function progressoMinimo(subtotal: number, minimo: number) {
  if (!minimo || minimo <= 0) return { exige: false, atingido: true, falta: 0, percentual: 100 };
  const falta = arredondar(Math.max(0, minimo - subtotal));
  return {
    exige: true,
    atingido: falta === 0,
    falta,
    percentual: Math.min(100, Math.round((subtotal / minimo) * 100)),
  };
}

/** Frete que vale para o pedido: zera acima do valor de frete grátis. null = a confirmar. */
export function freteFinal(freteBase: number | null, subtotal: number, freteGratisAcima: number | null): number | null {
  if (freteGratisAcima != null && freteGratisAcima > 0 && subtotal >= freteGratisAcima) return 0;
  return freteBase;
}

// --- operações sobre a lista de itens (imutáveis) ---

export function adicionarItem(itens: ItemCarrinho[], ofertaId: string, quantidade = 1): ItemCarrinho[] {
  const existente = itens.find((i) => i.ofertaId === ofertaId);
  if (existente) {
    return itens.map((i) =>
      i.ofertaId === ofertaId ? { ...i, quantidade: Math.min(QUANTIDADE_MAXIMA, i.quantidade + quantidade) } : i,
    );
  }
  return [...itens, { ofertaId, quantidade: Math.min(QUANTIDADE_MAXIMA, quantidade) }];
}

export function alterarQuantidade(itens: ItemCarrinho[], ofertaId: string, quantidade: number): ItemCarrinho[] {
  if (quantidade <= 0) return itens.filter((i) => i.ofertaId !== ofertaId);
  return itens.map((i) =>
    i.ofertaId === ofertaId ? { ...i, quantidade: Math.min(QUANTIDADE_MAXIMA, Math.floor(quantidade)) } : i,
  );
}

/** Aceita só o formato esperado do que veio do localStorage. */
export function validarItensSalvos(valor: unknown): ItemCarrinho[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (i): i is ItemCarrinho =>
        !!i &&
        typeof i === 'object' &&
        typeof (i as ItemCarrinho).ofertaId === 'string' &&
        Number.isInteger((i as ItemCarrinho).quantidade) &&
        (i as ItemCarrinho).quantidade > 0,
    )
    .map((i) => ({ ofertaId: i.ofertaId, quantidade: Math.min(QUANTIDADE_MAXIMA, i.quantidade) }));
}
