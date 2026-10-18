// Preço por quantidade a partir dos blocos (ofertas) do produto — MESMA regra do
// ERP (erp-consumer-2.0/src/lib/precoQuantidade.ts) e do banco
// (`erp_melhor_preco`, usada por `cardapio_criar_pedido`). Se mudar aqui, mude lá.
//
// Dada a quantidade em UNIDADES, monta a combinação de blocos mais barata que soma
// EXATAMENTE a quantidade — ex.: 4 latas = 3 por 11 + 1 por 4 = 15.
// Regras:
//   - cartão usa o preço de cartão (só quando TODO o pagamento é cartão);
//   - bloco "[Quente]" só entra se o próprio produto for quente (produto gelado
//     não vira pack quente sozinho);
//   - bloco com preço 0 fica fora (a view já não manda, mas o filtro protege);
//   - sem combinação exata, cai no preço unitário do produto.
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { Oferta, Produto } from './tipos';

export interface PartePreco {
  nome: string;
  qtd: number; // unidades por bloco
  vezes: number; // quantos blocos
  preco: number; // preço do bloco
}

export interface ResultadoPreco {
  total: number;
  partes: PartePreco[];
  economia: number; // em relação a unidades × preço da unidade
}

type ProdutoPreco = Pick<Produto, 'preco' | 'preco_cartao' | 'quente' | 'ofertas'>;

export const UNIDADES_MAXIMAS = 999; // mesmo teto do banco por produto

const centavos = (v: number) => Math.round(v * 100);

export function precoDoBloco(o: Oferta, cartao: boolean): number {
  return cartao ? (o.preco_cartao ?? o.preco) : o.preco;
}

/** Blocos que podem entrar na conta deste produto (mesmo filtro do banco). */
export function ofertasDeVenda(produto: Pick<Produto, 'quente' | 'ofertas'>): Oferta[] {
  return produto.ofertas.filter((o) => o.qtd >= 1 && o.preco > 0 && (produto.quente || !o.quente));
}

export function melhorPreco(produto: ProdutoPreco, unidades: number, cartao: boolean): ResultadoPreco {
  if (!Number.isFinite(unidades) || unidades <= 0) return { total: 0, partes: [], economia: 0 };
  const quantidade = Math.floor(unidades);
  const unitario = cartao ? (produto.preco_cartao ?? produto.preco) : produto.preco;
  const semOferta: ResultadoPreco = {
    total: centavos(unitario * quantidade) / 100,
    partes: [{ nome: 'Unidade', qtd: 1, vezes: quantidade, preco: unitario }],
    economia: 0,
  };

  // maiores primeiro: no empate de preço fica "1 pack de 12 + 1 un" em vez de "4× 3 un + 1 un"
  // (o total é o mesmo do ERP/banco; só a descrição do empate pode variar)
  const blocos = ofertasDeVenda(produto)
    .filter((o) => o.qtd <= quantidade)
    .sort((a, b) => b.qtd - a.qtd);
  if (blocos.length === 0 || quantidade > 1000) return semOferta;

  // menor custo (em centavos) para cada quantidade 0..N, montando só com blocos exatos
  const custo = new Array<number>(quantidade + 1).fill(Infinity);
  const escolha = new Array<number>(quantidade + 1).fill(-1);
  custo[0] = 0;
  for (let q = 1; q <= quantidade; q++) {
    blocos.forEach((b, i) => {
      if (b.qtd > q || custo[q - b.qtd] === Infinity) return;
      const c = custo[q - b.qtd] + centavos(precoDoBloco(b, cartao));
      if (c < custo[q]) {
        custo[q] = c;
        escolha[q] = i;
      }
    });
  }
  if (custo[quantidade] === Infinity) return semOferta;

  const contagem = new Map<number, number>();
  for (let q = quantidade; q > 0; q -= blocos[escolha[q]].qtd) {
    contagem.set(escolha[q], (contagem.get(escolha[q]) || 0) + 1);
  }
  const partes = Array.from(contagem.entries())
    .map(([i, vezes]) => ({ nome: blocos[i].nome, qtd: blocos[i].qtd, vezes, preco: precoDoBloco(blocos[i], cartao) }))
    .sort((a, b) => b.qtd - a.qtd);

  const total = custo[quantidade] / 100;
  // referência = bloco de 1 unidade (se houver) ou o preço do produto
  const umaUnidade = blocos.filter((b) => b.qtd === 1).map((b) => precoDoBloco(b, cartao));
  const referencia = (umaUnidade.length ? Math.min(...umaUnidade) : unitario) * quantidade;
  return { total, partes, economia: Math.max(0, centavos(referencia - total) / 100) };
}

const EMBALAGENS = ['mala', 'caixa', 'pack', 'fardo', 'engradado', 'trio', 'combo', 'kit', 'dúzia', 'duzia'];

/** "pack", "caixa"… do nome do bloco; null quando o nome não diz (ex.: "3x Antarctica"). */
function embalagem(nome: string): string | null {
  const primeira = nome.replace(/^\s*\[(promo|quente)\]\s*/gi, '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return EMBALAGENS.includes(primeira) ? primeira : null;
}

/**
 * Combinação em texto simples: "1 pack de 12 + 1 un", "2× 3 un + 1 un".
 * null quando é tudo unidade avulsa (não há o que explicar).
 */
export function descreverCombinacao(partes: PartePreco[]): string | null {
  if (!partes.some((p) => p.qtd > 1)) return null;
  return partes
    .map((p) => {
      if (p.qtd === 1) return `${p.vezes} un`;
      const nome = embalagem(p.nome);
      return nome ? `${p.vezes} ${nome}${p.vezes > 1 ? 's' : ''} de ${p.qtd}` : `${p.vezes}× ${p.qtd} un`;
    })
    .join(' + ');
}

/** Atalhos +6/+12 só quando o produto tem bloco desse tamanho. */
export function atalhosDoProduto(produto: Pick<Produto, 'quente' | 'ofertas'>): number[] {
  const tamanhos = new Set(ofertasDeVenda(produto).map((o) => o.qtd));
  return [6, 12].filter((n) => tamanhos.has(n));
}

/**
 * Linha da sacola para a conta: versão padrão (variante null, quantidade em
 * unidades → combinação mais barata) ou variante (quantidade em blocos → preço
 * fechado do bloco × blocos, como o banco faz com `{oferta_id, quantidade}`).
 */
export interface LinhaPreco {
  produto: ProdutoPreco;
  variante: Oferta | null;
  quantidade: number;
}

export function totalDaLinha(linha: LinhaPreco, cartao: boolean): number {
  if (linha.variante) return centavos(precoDoBloco(linha.variante, cartao) * linha.quantidade) / 100;
  return melhorPreco(linha.produto, linha.quantidade, cartao).total;
}

/** Subtotal da sacola: soma das linhas (centavos inteiros, como o numeric do banco). */
export function subtotalCarrinho(linhas: LinhaPreco[], cartao: boolean): number {
  return linhas.reduce((soma, l) => soma + centavos(totalDaLinha(l, cartao)), 0) / 100;
}
