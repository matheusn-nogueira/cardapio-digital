import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarProdutos, filtrarPorTermo } from '../busca.ts';
import type { Produto } from '../tipos.ts';

const produto = (nome: string, marca: string, categoria = 'Cervejas') =>
  ({ id: nome, nome, marca, categoria, apelidos: '' }) as unknown as Produto;

const catalogo = [
  produto('Brahma Duplo Malte Latão 473ml', 'Brahma'),
  produto('Heineken Long Neck 330ml', 'Heineken'),
  produto('Império Pilsen Latão 473ml', 'Império'),
  produto('Gelo Escama 5kg', '', 'Gelo e Carvão'),
  produto('Coca-Cola 2L', 'Coca-Cola', 'Refrigerantes'),
];
const nomes = (r: { produtos: Produto[] }) => r.produtos.map((p) => p.nome);

test('busca exata continua igual, sem acento', () => {
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'imperio latao')), ['Império Pilsen Latão 473ml']);
  assert.equal(buscarProdutos(catalogo, 'imperio').aproximado, false);
  assert.equal(filtrarPorTermo(catalogo, 'gelo').length, 1);
});

test('erro de digitação de quem digita pouco no celular (casos reais: brama, heinekem)', () => {
  const brama = buscarProdutos(catalogo, 'brama');
  assert.deepEqual(nomes(brama), ['Brahma Duplo Malte Latão 473ml']);
  assert.equal(brama.aproximado, true);
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'heinekem')), ['Heineken Long Neck 330ml']);
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'coca cola')), ['Coca-Cola 2L']);
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'imperio latao 473')), ['Império Pilsen Latão 473ml']);
});

test('número e palavra curta não aceitam erro (350 não vira 330)', () => {
  // mostra as Heineken avisando que o 350 ficou de fora, em vez de fingir que 330 é 350
  assert.deepEqual(buscarProdutos(catalogo, 'heineken 350').ignoradas, ['350']);
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'gel')), ['Gelo Escama 5kg']);
});

test('palavra que não existe no catálogo fica de fora e a tela avisa', () => {
  const r = buscarProdutos(catalogo, 'gelo barato');
  assert.deepEqual(nomes(r), ['Gelo Escama 5kg']);
  assert.deepEqual(r.ignoradas, ['barato']);
  assert.deepEqual(nomes(buscarProdutos(catalogo, 'xyzw')), []);
});
