// Mesma regra do ERP (precoQuantidade.ts) e do banco (erp_melhor_preco).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  atalhosDoProduto,
  descreverCombinacao,
  melhorPreco,
  ofertasDeVenda,
  subtotalCarrinho,
  totalDaLinha,
} from '../precoQuantidade.ts';
import type { Oferta, Produto } from '../tipos.ts';

const oferta = (o: Partial<Oferta>): Oferta => ({ nome: 'Unidade', qtd: 1, preco: 1, preco_cartao: 1, quente: false, ...o });
const produto = (ofertas: Oferta[], extra: Partial<Produto> = {}): Produto => ({
  id: 'p', nome: 'Brahma Lata 350ml', categoria: 'Cerveja', marca: 'Brahma', descricao: null, imagem_url: null,
  preco: 4.5, preco_cartao: 4.5, retornavel: false, selo: null, quente: false, apelidos: '', ofertas, variantes: [], ...extra,
});

// caso da validação: 4 Brahma = R$ 18,00 no site antigo, R$ 17,50 no ERP
const brahma = produto([
  oferta({ nome: 'Cerveja Brahma Lata', preco: 4.5, preco_cartao: 4.75 }),
  oferta({ nome: '[Promo] 3x Brahma Lata', qtd: 3, preco: 13, preco_cartao: 13.5 }),
  oferta({ nome: 'Pack Brahma Lata', qtd: 12, preco: 48, preco_cartao: 50 }),
  oferta({ nome: 'Pack Brahma Lata', qtd: 12, preco: 44, preco_cartao: 44, quente: true }),
]);

test('combina blocos: 4 latas = 3 por 13 + 1 por 4,50', () => {
  const r = melhorPreco(brahma, 4, false);
  assert.equal(r.total, 17.5);
  assert.deepEqual(r.partes.map((p) => [p.qtd, p.vezes]), [[3, 1], [1, 1]]);
  assert.equal(r.economia, 0.5);
  assert.equal(descreverCombinacao(r.partes), '1× 3 un + 1 un');
});

test('13 latas = 1 pack de 12 + 1 un (pack quente fica de fora no produto gelado)', () => {
  const r = melhorPreco(brahma, 13, false);
  assert.equal(r.total, 52.5);
  assert.equal(descreverCombinacao(r.partes), '1 pack de 12 + 1 un');
});

test('produto quente pode usar o bloco [Quente]', () => {
  const natural = { ...brahma, quente: true };
  assert.equal(melhorPreco(natural, 12, false).total, 44);
  assert.equal(ofertasDeVenda(brahma).length, 3);
  assert.equal(ofertasDeVenda(natural).length, 4);
});

test('cartão usa o preço de cartão de cada bloco', () => {
  assert.equal(melhorPreco(brahma, 4, true).total, 18.25);
  assert.equal(melhorPreco(brahma, 12, true).total, 50);
});

test('sem combinação exata cai no preço unitário do produto', () => {
  const soPack = produto([oferta({ nome: 'Mala', qtd: 6, preco: 20 })], { preco: 4, preco_cartao: 4.2 });
  assert.equal(melhorPreco(soPack, 5, false).total, 20);
  assert.equal(melhorPreco(soPack, 7, true).total, 29.4);
  assert.equal(melhorPreco(soPack, 6, false).total, 20);
  assert.equal(descreverCombinacao(melhorPreco(soPack, 12, false).partes), '2 malas de 6');
});

test('oferta de preço 0 nunca entra', () => {
  const p = produto([oferta({ preco: 4 }), oferta({ nome: 'Caixa', qtd: 23, preco: 0 })]);
  assert.equal(melhorPreco(p, 23, false).total, 92);
});

test('quantidade zero ou inválida = 0; só unidade = sem descrição', () => {
  assert.equal(melhorPreco(brahma, 0, false).total, 0);
  assert.equal(descreverCombinacao(melhorPreco(brahma, 2, false).partes), null);
});

test('atalhos +6/+12 só com bloco desse tamanho (bloco quente não conta no gelado)', () => {
  assert.deepEqual(atalhosDoProduto(brahma), [12]);
  assert.deepEqual(atalhosDoProduto(produto([oferta({}), oferta({ nome: 'Pack', qtd: 12, preco: 40, quente: true })])), []);
  assert.deepEqual(atalhosDoProduto(produto([oferta({}), oferta({ nome: 'Mala', qtd: 6, preco: 20 })])), [6]);
});

test('subtotal soma a melhor combinação de cada produto, sem erro de centavos', () => {
  const linhas = [
    { produto: brahma, variante: null, quantidade: 4 },
    { produto: produto([oferta({ preco: 0.1 })], { preco: 0.1 }), variante: null, quantidade: 3 },
  ];
  assert.equal(subtotalCarrinho(linhas, false), 17.8);
});

test('no empate de preço a descrição usa o bloco maior', () => {
  const antarctica = produto([
    oferta({ preco: 4.5 }),
    oferta({ nome: '[Promo] 3x Antarctica', qtd: 3, preco: 13 }),
    oferta({ nome: 'Pack Antarctica Latão', qtd: 12, preco: 52 }),
  ]);
  const r = melhorPreco(antarctica, 13, false);
  assert.equal(r.total, 56.5);
  assert.equal(descreverCombinacao(r.partes), '1 pack de 12 + 1 un');
  assert.equal(r.economia, 2);
});

test('variante: preço fechado do bloco × blocos (cartão usa preço cartão), somado à linha em unidades', () => {
  const natural = oferta({ nome: 'Pack Brahma Lata', qtd: 12, preco: 44, preco_cartao: 45.5, quente: true });
  const linhaNatural = { produto: brahma, variante: natural, quantidade: 2 };
  assert.equal(totalDaLinha(linhaNatural, false), 88);
  assert.equal(totalDaLinha(linhaNatural, true), 91);
  // 6 geladas (2× 3 por 13) + 2 packs naturais
  assert.equal(subtotalCarrinho([{ produto: brahma, variante: null, quantidade: 6 }, linhaNatural], false), 114);
});
