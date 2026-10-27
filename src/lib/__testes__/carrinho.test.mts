import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adicionarItem,
  adicionarVariante,
  alterarQuantidade,
  itensDasLinhas,
  itensDoPedido,
  migrarItens,
  montarLinhas,
  removerItem,
  validarItensSalvos,
  type MapaOfertas,
} from '../carrinho.ts';
import type { ItemSalvo, Produto } from '../tipos.ts';

test('aceita o formato novo e o antigo do navegador, descartando lixo', () => {
  const lidos = validarItensSalvos([
    { produtoId: 'p1', unidades: 3 },
    { ofertaId: 'of-pack', quantidade: 2 },
    { produtoId: 'p2', unidades: 0 },
    { ofertaId: 'x', quantidade: 1.5 },
    null,
    'texto',
  ]);
  assert.deepEqual(lidos, [{ produtoId: 'p1', unidades: 3 }, { ofertaId: 'of-pack', quantidade: 2 }]);
  assert.deepEqual(validarItensSalvos({}), []);
});

test('migra sacola antiga para unidades, somando por produto, sem perder o que não achou', () => {
  const mapa: MapaOfertas = new Map([
    ['of-un', { produtoId: 'brahma', qtd: 1, variante: false }],
    ['of-pack', { produtoId: 'brahma', qtd: 12, variante: false }],
    ['of-pack-quente', { produtoId: 'brahma', qtd: 12, variante: true }],
    ['of-gelo', { produtoId: 'gelo', qtd: 1, variante: false }],
  ]);
  const antigos: ItemSalvo[] = [
    { ofertaId: 'of-un', quantidade: 2 },
    { ofertaId: 'of-pack', quantidade: 1 },
    { ofertaId: 'of-pack-quente', quantidade: 2 },
    { produtoId: 'gelo', unidades: 1 },
    { ofertaId: 'of-gelo', quantidade: 2 },
    { ofertaId: 'of-sumiu', quantidade: 1 },
  ];
  assert.deepEqual(migrarItens(antigos, mapa), [
    { produtoId: 'gelo', unidades: 3 },
    { produtoId: 'brahma', unidades: 14 },
    { produtoId: 'brahma', ofertaId: 'of-pack-quente', quantidade: 2 },
    { ofertaId: 'of-sumiu', quantidade: 1 },
  ]);
});

test('operações por produto preservam itens antigos ainda não migrados', () => {
  let itens: ItemSalvo[] = [{ ofertaId: 'velho', quantidade: 1 }];
  itens = adicionarItem(itens, 'p1', 6);
  itens = adicionarItem(itens, 'p1', 1);
  assert.deepEqual(itens, [{ ofertaId: 'velho', quantidade: 1 }, { produtoId: 'p1', unidades: 7 }]);
  itens = alterarQuantidade(itens, 'p1', 2000);
  assert.deepEqual(itens[1], { produtoId: 'p1', unidades: 999 });
  itens = alterarQuantidade(itens, 'p1', 0);
  assert.deepEqual(itens, [{ ofertaId: 'velho', quantidade: 1 }]);
  assert.deepEqual(removerItem(adicionarItem(itens, 'p2'), 'p2'), itens);
});

test('variante fica em linha própria, separada das unidades do mesmo produto', () => {
  let itens: ItemSalvo[] = adicionarItem([], 'p1', 6);
  itens = adicionarVariante(itens, 'p1', 'of-q', 1);
  itens = adicionarVariante(itens, 'p1', 'of-q', 1);
  assert.deepEqual(itens, [{ produtoId: 'p1', unidades: 6 }, { produtoId: 'p1', ofertaId: 'of-q', quantidade: 2 }]);
  itens = alterarQuantidade(itens, 'of:of-q', 5);
  assert.deepEqual(itens[1], { produtoId: 'p1', ofertaId: 'of-q', quantidade: 5 });
  assert.deepEqual(removerItem(itens, 'of:of-q'), [{ produtoId: 'p1', unidades: 6 }]);
  assert.deepEqual(validarItensSalvos(itens), itens, 'variante sobrevive à leitura do navegador');
});

test('separa linhas, produtos/variantes que saíram do cardápio e itens antigos; monta itens do pedido', () => {
  const variante = { id: 'of-q', nome: 'Pack', qtd: 12, preco: 44, preco_cartao: 44, quente: true };
  const p1 = { id: 'p1', variantes: [variante] } as unknown as Produto;
  const r = montarLinhas(
    [
      { produtoId: 'p1', unidades: 2 },
      { produtoId: 'p1', ofertaId: 'of-q', quantidade: 3 },
      { produtoId: 'p1', ofertaId: 'of-sumiu', quantidade: 1 },
      { produtoId: 'sumiu', unidades: 1 },
      { ofertaId: 'velho', quantidade: 1 },
    ],
    (id) => (id === 'p1' ? p1 : undefined),
  );
  assert.equal(r.linhas.length, 2);
  assert.equal(r.indisponiveis.length, 2);
  assert.deepEqual(r.legados, [{ ofertaId: 'velho', quantidade: 1 }]);
  assert.deepEqual(itensDoPedido(r.linhas), [
    { product_id: 'p1', unidades: 2 },
    { oferta_id: 'of-q', quantidade: 3 },
  ]);
});

test('itensDasLinhas: pedido guardado volta igual para a sacola (Peça de novo)', () => {
  const p = { id: 'p1', variantes: [{ id: 'of9', qtd: 6 }] } as never;
  const salvos = [
    { produtoId: 'p1', unidades: 3 },
    { produtoId: 'p1', ofertaId: 'of9', quantidade: 2 },
  ];
  const { linhas } = montarLinhas(salvos, () => p);
  assert.deepEqual(itensDasLinhas(linhas), salvos);
});
