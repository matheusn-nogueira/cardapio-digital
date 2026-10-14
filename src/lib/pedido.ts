// Envio do pedido para `cardapio_criar_pedido` (RPC do Supabase).
// ATENÇÃO: essa função cria pedido REAL no ERP da loja. Em testes, sempre
// passe um `fetchFn` falso (ver src/lib/__testes__/pedido.test.mts).
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { Cliente, Endereco, FormaPagamento, ItemCarrinho, PayloadPedido, RespostaPedido } from './tipos';

export const MENSAGENS_ERRO_PEDIDO: Record<string, string> = {
  LOJA_FECHADA: 'A loja está fechada agora. Confira o horário de funcionamento e tente de novo mais tarde.',
  CARRINHO_VAZIO: 'Sua sacola está vazia. Adicione algum produto para fazer o pedido.',
  OFERTA_INDISPONIVEL: 'Algum item da sua sacola acabou de ficar indisponível. Revise a sacola e tente de novo.',
  PEDIDO_MINIMO: 'Seu pedido ainda não atingiu o valor mínimo.',
  FORA_DA_AREA: 'Infelizmente ainda não entregamos nesse endereço.',
  DADOS_INVALIDOS: 'Confira seu nome, WhatsApp e o endereço (rua e número) e tente de novo.',
  PAGAMENTO_INVALIDO: 'Essa forma de pagamento não está disponível. Escolha outra.',
};

export const MENSAGEM_ERRO_GENERICA =
  'Não conseguimos enviar seu pedido agora. Tente de novo em instantes ou chame a gente no WhatsApp.';

export class ErroPedido extends Error {
  codigo: string;
  constructor(codigo: string) {
    super(MENSAGENS_ERRO_PEDIDO[codigo] ?? MENSAGEM_ERRO_GENERICA);
    this.name = 'ErroPedido';
    this.codigo = codigo;
  }
}

/** O PostgREST devolve `{ code, message, … }`; a mensagem da exceção é o código. */
export function extrairCodigoErro(corpo: unknown): string {
  if (corpo && typeof corpo === 'object' && 'message' in corpo) {
    const mensagem = String((corpo as { message: unknown }).message ?? '').trim();
    const codigo = Object.keys(MENSAGENS_ERRO_PEDIDO).find((c) => mensagem.includes(c));
    if (codigo) return codigo;
  }
  return 'DESCONHECIDO';
}

export function montarPayloadPedido(dados: {
  cliente: Cliente;
  endereco: Endereco;
  itens: ItemCarrinho[];
  pagamento: FormaPagamento;
  trocoPara: number | null;
  observacoes: string;
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
    itens: dados.itens.map((i) => ({ oferta_id: i.ofertaId, quantidade: i.quantidade })),
    pagamento: dados.pagamento,
    troco_para: dados.pagamento === 'dinheiro' && dados.trocoPara ? dados.trocoPara : null,
    observacoes: dados.observacoes.trim(),
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
): Promise<RespostaPedido> {
  let resposta: Response;
  try {
    resposta = await fetchFn(conexao.url, {
      method: 'POST',
      headers: { ...conexao.cabecalhos, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: payload }),
    });
  } catch {
    throw new ErroPedido('SEM_CONEXAO');
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new ErroPedido(extrairCodigoErro(corpo));

  const r = corpo as Partial<RespostaPedido> | null;
  if (!r || r.numero == null) throw new ErroPedido('DESCONHECIDO');
  return {
    pedido_id: String(r.pedido_id),
    numero: Number(r.numero),
    subtotal: Number(r.subtotal),
    frete: Number(r.frete),
    total: Number(r.total),
  };
}
