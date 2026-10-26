// Andamento do pedido na tela de confirmação (26/10/2026): as etapas como o cliente entende,
// a partir do status do ERP (aguardando_preparo → em_preparo → saiu_entrega → entregue).
// Na retirada, "saiu_entrega" quer dizer pronto para buscar (mesma regra do aviso por push).
// Módulo puro para poder ser testado com `node --test`.

export type StatusPedido = 'aguardando_preparo' | 'em_preparo' | 'saiu_entrega' | 'entregue' | 'cancelado';

export interface EtapaPedido {
  titulo: string;
  estado: 'feita' | 'atual' | 'falta';
}

const ORDEM: StatusPedido[] = ['aguardando_preparo', 'em_preparo', 'saiu_entrega', 'entregue'];

export function etapasDoPedido(status: StatusPedido, retirada: boolean): EtapaPedido[] {
  const titulos = retirada
    ? ['Pedido recebido', 'Separando seu pedido', 'Pronto para retirar', 'Retirado']
    : ['Pedido recebido', 'Separando seu pedido', 'Saiu para entrega', 'Entregue'];
  const atual = Math.max(0, ORDEM.indexOf(status));
  return titulos.map((titulo, i) => ({
    titulo,
    // a última etapa concluída aparece como feita, não como "agora"
    estado: i < atual || (status === 'entregue' && i === atual) ? 'feita' : i === atual ? 'atual' : 'falta',
  }));
}

/** Pedido que não muda mais: para de consultar. */
export function pedidoEncerrado(status: StatusPedido | null): boolean {
  return status === 'entregue' || status === 'cancelado';
}
