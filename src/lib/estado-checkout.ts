'use client';

// Dados do checkout salvos no navegador. Cliente e endereço ficam no
// localStorage (próximo pedido já vem preenchido); o resto só na sessão.
import { criarArmazem } from './armazenamento';
import type { Cliente, Endereco, FormaPagamento, ResultadoFrete } from './tipos';

export const ENDERECO_VAZIO: Endereco = {
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: 'Rio de Janeiro',
  uf: 'RJ',
  referencia: '',
  latitude: null,
  longitude: null,
};

const texto = (v: unknown, padrao = '') => (typeof v === 'string' ? v.slice(0, 200) : padrao);
const numeroOuNulo = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const armazemCliente = criarArmazem<Cliente>(
  'cdf:cliente',
  { nome: '', telefone: '' },
  {
    validar: (b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      return { nome: texto(o.nome), telefone: texto(o.telefone) };
    },
  },
);

export const armazemEndereco = criarArmazem<Endereco>('cdf:endereco', ENDERECO_VAZIO, {
  validar: (b) => {
    const o = (b ?? {}) as Record<string, unknown>;
    return {
      cep: texto(o.cep),
      rua: texto(o.rua),
      numero: texto(o.numero),
      complemento: texto(o.complemento),
      bairro: texto(o.bairro),
      cidade: texto(o.cidade, 'Rio de Janeiro'),
      uf: texto(o.uf, 'RJ'),
      referencia: texto(o.referencia),
      latitude: numeroOuNulo(o.latitude),
      longitude: numeroOuNulo(o.longitude),
    };
  },
});

/** Identifica o endereço para saber se o frete calculado ainda vale. */
export function chaveEndereco(e: Endereco): string {
  return [e.cep.replace(/\D/g, ''), e.rua, e.numero, e.bairro, e.cidade, e.uf]
    .map((p) => p.trim().toLowerCase())
    .join('|');
}

export interface FreteSalvo {
  chave: string;
  resultado: ResultadoFrete;
  /** Date.now() do cálculo: frete salvo vale por VALIDADE_FRETE_MS e depois é recalculado. */
  calculadoEm: number;
}

/** Frete salvo no navegador vale 30 min (faixas podem mudar); depois recalcula. */
export const VALIDADE_FRETE_MS = 30 * 60 * 1000;

export function freteVencido(salvo: FreteSalvo, agora = Date.now()): boolean {
  return agora - salvo.calculadoEm > VALIDADE_FRETE_MS;
}

export const armazemFrete = criarArmazem<FreteSalvo | null>('cdf:frete', null, {
  validar: (b) => {
    const o = b as FreteSalvo | null;
    if (!o || typeof o.chave !== 'string' || !o.resultado) return null;
    return {
      chave: o.chave,
      resultado: {
        distancia_km: numeroOuNulo(o.resultado.distancia_km),
        frete: numeroOuNulo(o.resultado.frete),
        bloqueado: o.resultado.bloqueado === true,
      },
      // salvo antes da validade existir → vencido (recalcula ao abrir)
      calculadoEm: numeroOuNulo(o.calculadoEm) ?? 0,
    };
  },
});

export interface DetalhesPedido {
  observacoes: string;
  pagamento: FormaPagamento | null;
  /** Texto digitado no "troco para" (ex.: "100"). */
  trocoPara: string;
}

/** Aceita o que estava salvo antes (crédito/débito viraram "cartão"). */
export function normalizarPagamento(v: unknown): FormaPagamento | null {
  if (v === 'credito' || v === 'debito' || v === 'cartao') return 'cartao';
  return v === 'pix' || v === 'dinheiro' ? v : null;
}

export const armazemDetalhes = criarArmazem<DetalhesPedido>(
  'cdf:detalhes',
  { observacoes: '', pagamento: null, trocoPara: '' },
  {
    tipo: 'sessao',
    validar: (b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      return {
        observacoes: typeof o.observacoes === 'string' ? o.observacoes.slice(0, 500) : '',
        pagamento: normalizarPagamento(o.pagamento),
        trocoPara: texto(o.trocoPara).slice(0, 12),
      };
    },
  },
);

/**
 * Chave (uuid) da tentativa de pedido em andamento. Fica guardada até o pedido ser
 * aceito: se a rede cair, o reenvio usa a mesma chave e o banco não duplica.
 */
export const armazemChavePedido = criarArmazem<string | null>('cdf:chave-pedido', null, {
  tipo: 'sessao',
  validar: (b) => (typeof b === 'string' && /^[0-9a-f-]{36}$/i.test(b) ? b : null),
});

export interface PedidoConfirmado {
  /** id do pedido no banco (liga a inscrição de push ao pedido); ausente em pedidos salvos antes. */
  pedidoId?: string;
  numero: number;
  subtotal: number;
  frete: number;
  total: number;
  pagamento: FormaPagamento;
  trocoPara: number | null;
  nomeCliente: string;
  itens: string[];
  endereco: string;
  /** O banco já tinha esse pedido (reenvio depois de falha de rede). */
  repetido?: boolean;
}

export const armazemUltimoPedido = criarArmazem<PedidoConfirmado | null>('cdf:ultimo-pedido', null, {
  tipo: 'sessao',
});

/** Forma de pagamento do último pedido, no aparelho: na próxima compra já vem marcada. */
export const armazemPagamentoPreferido = criarArmazem<FormaPagamento | null>('cdf:pagamento', null, {
  validar: (b) => normalizarPagamento(b),
});

export const NOMES_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão (na entrega)',
};

/** Nome da forma de pagamento, aceitando o que ficou salvo no formato antigo. */
export function nomePagamento(forma: unknown): string {
  const f = normalizarPagamento(forma);
  return f ? NOMES_PAGAMENTO[f] : 'A combinar';
}
