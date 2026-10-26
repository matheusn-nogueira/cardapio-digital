import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etapasDoPedido, pedidoEncerrado } from '../andamento.ts';

test('entrega: as etapas acompanham o status do ERP', () => {
  assert.deepEqual(etapasDoPedido('aguardando_preparo', false).map((e) => e.estado), ['atual', 'falta', 'falta', 'falta']);
  assert.deepEqual(etapasDoPedido('saiu_entrega', false).map((e) => e.estado), ['feita', 'feita', 'atual', 'falta']);
  assert.deepEqual(etapasDoPedido('entregue', false).map((e) => e.estado), ['feita', 'feita', 'feita', 'feita']);
  assert.equal(etapasDoPedido('saiu_entrega', false)[2].titulo, 'Saiu para entrega');
});

test('retirada: "saiu_entrega" é pronto para retirar', () => {
  assert.equal(etapasDoPedido('saiu_entrega', true)[2].titulo, 'Pronto para retirar');
  // o ERP pode ir de "em preparo" direto para "entregue" na retirada
  assert.deepEqual(etapasDoPedido('entregue', true).map((e) => e.estado), ['feita', 'feita', 'feita', 'feita']);
});

test('para de consultar quando o pedido termina', () => {
  assert.equal(pedidoEncerrado('entregue'), true);
  assert.equal(pedidoEncerrado('cancelado'), true);
  assert.equal(pedidoEncerrado('em_preparo'), false);
  assert.equal(pedidoEncerrado(null), false);
});
