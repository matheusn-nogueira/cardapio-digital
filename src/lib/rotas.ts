// Rotas da compra (checkout em etapas, pagamento e confirmação): sem topo da loja, abas,
// sacola flutuante; nas etapas, também sem o rodapé do site (nada que tire o foco do pedido).
export function ehRotaDeCompra(caminho: string): boolean {
  return caminho.startsWith('/checkout') || caminho === '/payment' || caminho === '/confirmation';
}

/** Etapas em que a pessoa ainda está preenchendo (a confirmação mostra o rodapé, com o WhatsApp). */
export function ehEtapaDoCheckout(caminho: string): boolean {
  return caminho.startsWith('/checkout') || caminho === '/payment';
}
