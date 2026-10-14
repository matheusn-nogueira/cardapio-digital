// Regras de exibição e preço das ofertas (unidade de venda do cardápio).
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { FormaPagamento, Oferta, Produto } from './tipos';

/** Cartão na entrega (crédito/débito) usa a tabela cartão em TODOS os itens. */
export function usaPrecoCartao(forma: FormaPagamento | null | undefined): boolean {
  return forma === 'credito' || forma === 'debito';
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
 * Rótulo curto da oferta: "Unidade", "Mala c/ 6", "Pack c/ 12", "4 unidades",
 * "Vasilhame Incluso"… O nome completo da oferta fica como fallback.
 */
export function rotuloOferta(oferta: Oferta, produto: Produto): string {
  const nome = limparNome(oferta.nome);

  if (oferta.qtd <= 1) {
    const unitarias = produto.ofertas.filter((o) => o.qtd <= 1);
    const nomesDistintos = new Set(unitarias.map((o) => limparNome(o.nome).toLowerCase()));
    // Variações da mesma unidade (ex.: "… - Somente o Líquido" / "… - Vasilhame Incluso")
    if (nomesDistintos.size > 1 && nome.includes(' - ')) {
      return nome.slice(nome.lastIndexOf(' - ') + 3).trim();
    }
    return 'Unidade';
  }

  const multiplo = nome.match(/^(\d+)\s*x\b/i);
  if (multiplo) return `${multiplo[1]} unidades`;

  const primeiraPalavra = nome.split(/\s+/)[0] ?? '';
  if (PALAVRAS_EMBALAGEM.includes(primeiraPalavra.toLowerCase())) {
    return `${primeiraPalavra} c/ ${oferta.qtd}`;
  }
  return `${nome} c/ ${oferta.qtd}`;
}

/** Oferta mostrada no card: unidade gelada > unidade > a primeira. */
export function ofertaPrincipal(produto: Produto): Oferta {
  return (
    produto.ofertas.find((o) => o.qtd <= 1 && !o.quente) ??
    produto.ofertas.find((o) => o.qtd <= 1) ??
    produto.ofertas[0]
  );
}

/** Produto tem versão natural (quente) em alguma oferta → vale marcar as geladas. */
export function temVersaoQuente(produto: Produto): boolean {
  return produto.ofertas.some((o) => o.quente);
}

/** Preço por unidade de um bloco (ex.: Mala c/ 6 por R$ 54 → R$ 9/un). */
export function precoPorUnidade(oferta: Oferta, forma: FormaPagamento | null | undefined): number | null {
  if (oferta.qtd <= 1) return null;
  return precoOferta(oferta, forma) / oferta.qtd;
}
