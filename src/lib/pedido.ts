// Envio do pedido para `cardapio_criar_pedido` (RPC do Supabase).
// ATENÇÃO: essa função cria pedido REAL no ERP da loja. Em testes, sempre
// passe um `fetchFn` falso (ver src/lib/__testes__/pedido.test.mts).
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type {
  Cliente,
  Endereco,
  FormaPagamento,
  ItemPedido,
  PayloadPedido,
  RespostaPedido,
  TotaisServidor,
} from './tipos';

export const MENSAGENS_ERRO_PEDIDO: Record<string, string> = {
  LOJA_FECHADA: 'A loja está fechada agora. Confira o horário de funcionamento e tente de novo mais tarde.',
  CARRINHO_VAZIO: 'Sua sacola está vazia. Adicione algum produto para fazer o pedido.',
  OFERTA_INDISPONIVEL: 'Algum produto da sua sacola ficou indisponível. Revise a sacola e tente de novo.',
  PEDIDO_MINIMO: 'Seu pedido ainda não atingiu o valor mínimo. Adicione mais itens para continuar.',
  FORA_DA_AREA: 'Ainda não entregamos nesse endereço. Confira a rua e o número ou chame a loja no WhatsApp.',
  DADOS_INVALIDOS: 'Confira seu nome, WhatsApp e o endereço (rua e número) e tente de novo.',
  PAGAMENTO_INVALIDO: 'Essa forma de pagamento não está disponível agora. Escolha outra.',
  PRECO_MUDOU: 'Os valores do pedido mudaram. Confira o novo total antes de enviar.',
  TEMPO_ESGOTADO: 'Conexão lenta. Verifique se o pedido chegou antes de tentar de novo.',
  SEM_CONEXAO: 'Sem conexão com a internet. Verifique sua conexão e tente de novo.',
};

export const MENSAGEM_ERRO_GENERICA =
  'Não conseguimos enviar seu pedido agora. Tente de novo em instantes ou chame a gente no WhatsApp.';

/** Erros em que o pedido pode ter chegado: repetir com a MESMA chave é seguro. */
export const ERROS_DE_REDE = ['TEMPO_ESGOTADO', 'SEM_CONEXAO', 'DESCONHECIDO'];

/** Tempo máximo esperando o banco antes de avisar "conexão lenta". */
export const TEMPO_LIMITE_PEDIDO_MS = 20_000;

export class ErroPedido extends Error {
  codigo: string;
  /** PRECO_MUDOU: valores recalculados pelo banco. */
  totais: TotaisServidor | null;
  constructor(codigo: string, totais: TotaisServidor | null = null) {
    super(MENSAGENS_ERRO_PEDIDO[codigo] ?? MENSAGEM_ERRO_GENERICA);
    this.name = 'ErroPedido';
    this.codigo = codigo;
    this.totais = totais;
  }
}

/** O PostgREST devolve `{ code, message, details, … }`; a mensagem da exceção é o código. */
export function extrairCodigoErro(corpo: unknown): string {
  if (corpo && typeof corpo === 'object' && 'message' in corpo) {
    const mensagem = String((corpo as { message: unknown }).message ?? '').trim();
    const codigo = Object.keys(MENSAGENS_ERRO_PEDIDO).find((c) => mensagem.includes(c));
    if (codigo) return codigo;
  }
  return 'DESCONHECIDO';
}

/** DETAIL do PRECO_MUDOU: json `{subtotal, frete, total}` em texto. */
export function extrairTotais(corpo: unknown): TotaisServidor | null {
  try {
    const detalhe = (corpo as { details?: unknown } | null)?.details;
    const d = typeof detalhe === 'string' ? JSON.parse(detalhe) : detalhe;
    const subtotal = Number(d?.subtotal);
    const frete = Number(d?.frete);
    const total = Number(d?.total);
    return [subtotal, frete, total].every(Number.isFinite) ? { subtotal, frete, total } : null;
  } catch {
    return null;
  }
}

/** uuid da tentativa de pedido (crypto.randomUUID só existe em https/localhost). */
export function novaChave(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function montarPayloadPedido(dados: {
  cliente: Cliente;
  endereco: Endereco;
  itens: ItemPedido[];
  pagamento: FormaPagamento;
  trocoPara: number | null;
  observacoes: string;
  chave: string;
  totalEsperado: number;
}): PayloadPedido {
  const e = dados.endereco;
  return {
    cliente: { nome: dados.cliente.nome.trim(), telefone: dados.cliente.telefone.replace(/\D/g, '') },
    endereco: {
      cep: e.cep.replace(/\D/g, ''),
      rua: e.rua.trim(),
      numero: e.numero.trim(),
      complemento: e.complemento.trim(),
      bairro: e.bairro.trim(),
      cidade: e.cidade.trim(),
      uf: e.uf.trim().toUpperCase(),
      referencia: e.referencia.trim(),
      latitude: e.latitude,
      longitude: e.longitude,
    },
    itens: dados.itens,
    pagamento: dados.pagamento,
    troco_para: dados.pagamento === 'dinheiro' && dados.trocoPara ? dados.trocoPara : null,
    observacoes: dados.observacoes.trim(),
    chave: dados.chave,
    total_esperado: Math.round(dados.totalEsperado * 100) / 100,
  };
}

export interface ConexaoPedido {
  /** URL completa do RPC: …/rest/v1/rpc/cardapio_criar_pedido */
  url: string;
  cabecalhos: Record<string, string>;
}

export async function enviarPedido(
  payload: PayloadPedido,
  conexao: ConexaoPedido,
  fetchFn: typeof fetch = fetch,
  tempoLimiteMs = TEMPO_LIMITE_PEDIDO_MS,
): Promise<RespostaPedido> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), tempoLimiteMs);
  let resposta: Response;
  let corpo: unknown;
  try {
    resposta = await fetchFn(conexao.url, {
      method: 'POST',
      headers: { ...conexao.cabecalhos, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: payload }),
      signal: controle.signal,
    });
    corpo = await resposta.json().catch(() => null);
  } catch {
    throw new ErroPedido(controle.signal.aborted ? 'TEMPO_ESGOTADO' : 'SEM_CONEXAO');
  } finally {
    clearTimeout(relogio);
  }

  if (!resposta.ok) {
    const codigo = extrairCodigoErro(corpo);
    throw new ErroPedido(codigo, codigo === 'PRECO_MUDOU' ? extrairTotais(corpo) : null);
  }

  const r = corpo as (Partial<RespostaPedido> & { repetido?: unknown }) | null;
  if (!r || r.numero == null) throw new ErroPedido('DESCONHECIDO');
  return {
    pedido_id: String(r.pedido_id),
    numero: Number(r.numero),
    subtotal: Number(r.subtotal),
    frete: Number(r.frete),
    total: Number(r.total),
    repetido: r.repetido === true,
  };
}
