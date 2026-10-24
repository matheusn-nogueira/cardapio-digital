// Regras de exibição dos blocos (ofertas) do cardápio. O preço do carrinho sai
// de precoQuantidade.ts; aqui é só rótulo e tabela de preços.
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { FormaPagamento, Oferta, Produto, Variante } from './tipos';

/** Cartão na entrega usa a tabela cartão em TODOS os itens. */
export function usaPrecoCartao(forma: FormaPagamento | null | undefined): boolean {
  return forma === 'cartao';
}

export function precoOferta(oferta: Oferta, forma: FormaPagamento | null | undefined): number {
  return usaPrecoCartao(forma) ? oferta.preco_cartao : oferta.preco;
}

export function ofertaPromocional(oferta: Oferta): boolean {
  return /^\s*\[promo\]/i.test(oferta.nome);
}

function limparNome(nome: string): string {
  return nome.replace(/^\s*\[promo\]\s*/i, '').trim();
}

const PALAVRAS_EMBALAGEM = ['mala', 'caixa', 'pack', 'fardo', 'engradado', 'trio', 'combo', 'kit', 'dúzia', 'duzia'];

/**
 * Rótulo curto da oferta: "Unidade", "Mala c/ 6", "Pack c/ 12", "4 unidades"…
 * O nome completo da oferta fica como fallback.
 */
export function rotuloOferta(oferta: Oferta): string {
  if (oferta.qtd <= 1) return 'Unidade';
  const nome = limparNome(oferta.nome);

  const multiplo = nome.match(/^(\d+)\s*x\b/i);
  if (multiplo) return `${multiplo[1]} unidades`;

  const primeiraPalavra = nome.split(/\s+/)[0] ?? '';
  if (PALAVRAS_EMBALAGEM.includes(primeiraPalavra.toLowerCase())) {
    return `${primeiraPalavra} c/ ${oferta.qtd}`;
  }
  return `${nome} c/ ${oferta.qtd}`;
}

/**
 * Tabela de preços do produto: um bloco por tamanho (o mais barato, que é o que a
 * combinação usaria), do menor para o maior. Só blocos de venda.
 */
export function tabelaDePrecos(ofertas: Oferta[]): Oferta[] {
  const porTamanho = new Map<number, Oferta>();
  for (const o of ofertas) {
    const atual = porTamanho.get(o.qtd);
    if (!atual || o.preco < atual.preco) porTamanho.set(o.qtd, o);
  }
  return [...porTamanho.values()].sort((a, b) => a.qtd - b.qtd);
}

/** Bloco com o menor preço por unidade (para chamar atenção no card): null se não houver bloco > 1. */
export function melhorBloco(ofertas: Oferta[]): Oferta | null {
  const blocos = ofertas.filter((o) => o.qtd > 1);
  if (!blocos.length) return null;
  return blocos.reduce((melhor, o) => (o.preco / o.qtd < melhor.preco / melhor.qtd ? o : melhor));
}

/** Preço por unidade de um bloco (ex.: Mala c/ 6 por R$ 54 → R$ 9/un). */
export function precoPorUnidade(oferta: Oferta, forma: FormaPagamento | null | undefined): number | null {
  if (oferta.qtd <= 1) return null;
  return precoOferta(oferta, forma) / oferta.qtd;
}

/** Preço "cheio" do bloco: as mesmas unidades compradas avulsas (o "de" do preço riscado). */
export function precoCheio(oferta: Oferta, precoUnidade: number): number {
  return Math.round(oferta.qtd * precoUnidade * 100) / 100;
}

/** Desconto do bloco em relação às unidades avulsas, em % inteiro (0 quando não compensa). */
export function descontoDoBloco(oferta: Oferta, precoUnidade: number): number {
  if (oferta.qtd <= 1 || precoUnidade <= 0) return 0;
  const cheio = precoCheio(oferta, precoUnidade);
  if (oferta.preco >= cheio) return 0;
  return Math.round((1 - oferta.preco / cheio) * 100);
}


// --- versões de escolha explícita (variantes) ---

/**
 * Separa os blocos da combinação automática das variantes (mesma decisão do banco):
 *  (a) bloco [Quente] de produto gelado;
 *  (b) com mais de uma unidade (qtd 1) não-quente, as mais caras que a mais barata
 *      (ex.: galão "Vasilhame Incluso" R$ 35 vs "Somente o Líquido" R$ 8).
 * A unidade mais barata continua sendo a unidade normal.
 */
export function separarVariantes<T extends Oferta>(ofertas: T[], produtoQuente: boolean): { venda: T[]; variantes: T[] } {
  const variantes = new Set<T>();
  if (!produtoQuente) for (const o of ofertas) if (o.quente) variantes.add(o);
  const unidades = ofertas.filter((o) => o.qtd === 1 && !o.quente);
  if (unidades.length > 1) {
    const menor = Math.min(...unidades.map((o) => o.preco));
    for (const o of unidades) if (o.preco > menor) variantes.add(o);
  }
  return { venda: ofertas.filter((o) => !variantes.has(o)), variantes: ofertas.filter((o) => variantes.has(o)) };
}

/** "Vasilhame Incluso" → "Vasilhame incluso". */
const frase = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t);

/** Sufixo depois do último " - " ("Água Galão 20L - Vasilhame Incluso" → "Vasilhame incluso"). */
function sufixo(nome: string): string | null {
  const limpo = limparNome(nome);
  const i = limpo.lastIndexOf(' - ');
  return i >= 0 ? frase(limpo.slice(i + 3).trim()) : null;
}

/** Nome curto da versão: "Natural (sem gelar)", "Vasilhame incluso". */
export function rotuloVariante(v: Pick<Oferta, 'nome' | 'quente'>): string {
  if (v.quente) return 'Natural (sem gelar)';
  return sufixo(v.nome) ?? limparNome(v.nome);
}

/** Tamanho do bloco da versão: "Pack 12", "Mala 6", "12 un"; null para unidade comum. */
export function detalheVariante(v: Pick<Oferta, 'nome' | 'qtd' | 'quente'>): string | null {
  if (v.qtd <= 1) return v.quente ? 'Unidade' : null;
  const primeira = limparNome(v.nome).split(/\s+/)[0] ?? '';
  return PALAVRAS_EMBALAGEM.includes(primeira.toLowerCase()) ? `${frase(primeira)} ${v.qtd}` : `${v.qtd} un`;
}

/** Nome da versão padrão (preço por quantidade): "Gelada" quando há natural; senão o sufixo da unidade. */
export function rotuloPadrao(produto: Pick<Produto, 'ofertas' | 'variantes'>): string {
  if (produto.variantes.some((v) => v.quente)) return 'Gelada';
  const unidade = produto.ofertas.find((o) => o.qtd === 1);
  return (unidade && sufixo(unidade.nome)) || 'Padrão';
}

/** Texto completo da variante para sacola/resumo: "Natural (sem gelar) · Pack 12". */
export function descreverVariante(v: Variante): string {
  const detalhe = detalheVariante(v);
  return detalhe ? `${rotuloVariante(v)} · ${detalhe}` : rotuloVariante(v);
}
