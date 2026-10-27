// Itens da sacola e contas auxiliares. Módulo puro (só importa tipos) para poder
// ser testado com `node --test`. O banco recalcula tudo em `cardapio_criar_pedido`.
//
// Dois tipos de linha:
//  - versão padrão: produto + UNIDADES (combinação de blocos mais barata);
//  - variante (natural, vasilhame…): oferta + BLOCOS, preço fechado do bloco.
// O mesmo produto pode ter as duas linhas (ex.: 6 geladas + 1 pack natural).
import type { ItemCarrinho, ItemLegado, ItemPedido, ItemSalvo, ItemVariante, Produto, Variante } from './tipos';

export const QUANTIDADE_MAXIMA = 999; // unidades ou blocos por linha (mesmo teto do banco)

export interface LinhaCarrinho {
  /** produtoId (versão padrão) ou "of:<ofertaId>" (variante). */
  chave: string;
  produto: Produto;
  /** null = versão padrão. */
  variante: Variante | null;
  /** Unidades (padrão) ou blocos (variante). */
  quantidade: number;
}

export function ehLegado(item: ItemSalvo): item is ItemLegado {
  return 'ofertaId' in item && !('produtoId' in item);
}

export function ehVariante(item: ItemSalvo): item is ItemVariante {
  return 'ofertaId' in item && 'produtoId' in item;
}

export function ehUnidades(item: ItemSalvo): item is ItemCarrinho {
  return 'unidades' in item;
}

/** Chave da linha: identifica o item para alterar/remover. */
export function chaveItem(item: ItemSalvo): string {
  return ehUnidades(item) ? item.produtoId : `of:${item.ofertaId}`;
}

const limitar = (n: number) => Math.min(QUANTIDADE_MAXIMA, Math.max(0, Math.floor(n)));

/**
 * Monta as linhas com o catálogo atual. Produto (ou variante) que saiu do cardápio
 * vai para `indisponiveis`; item no formato antigo ainda não migrado, para `legados`.
 */
export function montarLinhas(itens: ItemSalvo[], produtoDe: (id: string) => Produto | undefined) {
  const linhas: LinhaCarrinho[] = [];
  const indisponiveis: ItemSalvo[] = [];
  const legados: ItemLegado[] = [];
  for (const item of itens) {
    if (ehLegado(item)) {
      legados.push(item);
      continue;
    }
    const produto = produtoDe(item.produtoId);
    if (ehUnidades(item)) {
      if (produto) linhas.push({ chave: chaveItem(item), produto, variante: null, quantidade: item.unidades });
      else indisponiveis.push(item);
      continue;
    }
    const variante = produto?.variantes.find((v) => v.id === item.ofertaId);
    if (produto && variante) linhas.push({ chave: chaveItem(item), produto, variante, quantidade: item.quantidade });
    else indisponiveis.push(item);
  }
  return { linhas, indisponiveis, legados };
}

/** Linhas de volta ao formato salvo no aparelho (para guardar o pedido e repetir depois). */
export function itensDasLinhas(linhas: LinhaCarrinho[]): ItemSalvo[] {
  return linhas.map((l) =>
    l.variante
      ? { produtoId: l.produto.id, ofertaId: l.variante.id, quantidade: l.quantidade }
      : { produtoId: l.produto.id, unidades: l.quantidade },
  );
}

/** Unidades físicas da linha (variante: blocos × tamanho do bloco). */
export function unidadesDaLinha(l: LinhaCarrinho): number {
  return l.variante ? l.quantidade * l.variante.qtd : l.quantidade;
}

export function contarUnidades(linhas: LinhaCarrinho[]): number {
  return linhas.reduce((soma, l) => soma + unidadesDaLinha(l), 0);
}

/** Itens no formato do banco: padrão em unidades, variante em blocos da oferta. */
export function itensDoPedido(linhas: LinhaCarrinho[]): ItemPedido[] {
  return linhas.map((l) =>
    l.variante ? { oferta_id: l.variante.id, quantidade: l.quantidade } : { product_id: l.produto.id, unidades: l.quantidade },
  );
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

// --- operações sobre a lista de itens (imutáveis; itens antigos são preservados) ---

/** Quantidade guardada na linha (unidades ou blocos). */
function quantidadeDe(item: ItemSalvo): number {
  return ehUnidades(item) ? item.unidades : item.quantidade;
}

function comQuantidade(item: ItemSalvo, n: number): ItemSalvo {
  return ehUnidades(item) ? { ...item, unidades: n } : { ...item, quantidade: n };
}

/** Quantidade na linha de chave dada (0 se não houver). */
export function quantidadeNaLinha(itens: ItemSalvo[], chave: string): number {
  const item = itens.find((i) => !ehLegado(i) && chaveItem(i) === chave);
  return item ? quantidadeDe(item) : 0;
}

/** Soma na linha existente ou cria uma nova. */
export function somarItem(itens: ItemSalvo[], novo: ItemCarrinho | ItemVariante): ItemSalvo[] {
  const chave = chaveItem(novo);
  if (itens.some((i) => !ehLegado(i) && chaveItem(i) === chave)) {
    return itens.map((i) =>
      !ehLegado(i) && chaveItem(i) === chave ? comQuantidade(i, limitar(quantidadeDe(i) + quantidadeDe(novo))) : i,
    );
  }
  const n = limitar(quantidadeDe(novo));
  return n > 0 ? [...itens, comQuantidade(novo, n)] : itens;
}

export function adicionarItem(itens: ItemSalvo[], produtoId: string, unidades = 1): ItemSalvo[] {
  return somarItem(itens, { produtoId, unidades });
}

export function adicionarVariante(itens: ItemSalvo[], produtoId: string, ofertaId: string, quantidade = 1): ItemSalvo[] {
  return somarItem(itens, { produtoId, ofertaId, quantidade });
}

export function alterarQuantidade(itens: ItemSalvo[], chave: string, quantidade: number): ItemSalvo[] {
  if (quantidade <= 0) return removerItem(itens, chave);
  return itens.map((i) => (!ehLegado(i) && chaveItem(i) === chave ? comQuantidade(i, limitar(quantidade)) : i));
}

export function removerItem(itens: ItemSalvo[], chave: string): ItemSalvo[] {
  return itens.filter((i) => ehLegado(i) || chaveItem(i) !== chave);
}

const inteiroPositivo = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;

/** Aceita os formatos atuais (unidades, variante) e o antigo ({ofertaId, quantidade}). */
export function validarItensSalvos(valor: unknown): ItemSalvo[] {
  if (!Array.isArray(valor)) return [];
  const saida: ItemSalvo[] = [];
  for (const bruto of valor) {
    if (!bruto || typeof bruto !== 'object') continue;
    const i = bruto as Record<string, unknown>;
    if (typeof i.produtoId === 'string' && inteiroPositivo(i.unidades)) {
      saida.push({ produtoId: i.produtoId, unidades: limitar(i.unidades) });
    } else if (typeof i.ofertaId === 'string' && inteiroPositivo(i.quantidade)) {
      saida.push(
        typeof i.produtoId === 'string'
          ? { produtoId: i.produtoId, ofertaId: i.ofertaId, quantidade: limitar(i.quantidade) }
          : { ofertaId: i.ofertaId, quantidade: limitar(i.quantidade) },
      );
    }
  }
  return saida;
}

/** id da oferta → produto, tamanho do bloco e se é variante (lido do banco só para sacola antiga). */
export type MapaOfertas = Map<string, { produtoId: string; qtd: number; variante: boolean }>;

/**
 * Converte itens do formato antigo: oferta comum vira unidades do produto (somando
 * com o que já houver); oferta variante (natural, vasilhame…) vira linha de variante.
 * Oferta que não existe mais fica como está (aparece como indisponível).
 */
export function migrarItens(itens: ItemSalvo[], mapa: MapaOfertas): ItemSalvo[] {
  let saida: ItemSalvo[] = itens.filter((i) => !ehLegado(i));
  const sobras: ItemLegado[] = [];
  for (const item of itens) {
    if (!ehLegado(item)) continue;
    const achado = mapa.get(item.ofertaId);
    if (!achado) sobras.push(item);
    else if (achado.variante) saida = adicionarVariante(saida, achado.produtoId, item.ofertaId, item.quantidade);
    else saida = adicionarItem(saida, achado.produtoId, item.quantidade * Math.max(1, achado.qtd));
  }
  return [...saida, ...sobras];
}
