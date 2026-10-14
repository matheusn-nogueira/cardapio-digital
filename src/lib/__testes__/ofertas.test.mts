import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ofertaPrincipal, precoOferta, rotuloOferta } from '../ofertas.ts';
import type { Oferta, Produto } from '../tipos.ts';

const oferta = (o: Partial<Oferta>): Oferta => ({ id: 'x', nome: 'x', qtd: 1, preco: 1, preco_cartao: 1, quente: false, ...o });
const produto = (ofertas: Oferta[]): Produto => ({
  id: 'p', nome: 'Amstel Latão 473ml', categoria: 'Cerveja', marca: 'Amstel', descricao: null, imagem_url: null,
  preco: 4.5, preco_cartao: 4.5, retornavel: false, gelada: true, destaque: false, selo: null, ordem: 9999,
  vendas_recentes: 0, ofertas,
});

test('rótulos curtos das ofertas', () => {
  const un = oferta({ id: 'a', nome: 'Cerveja Amstel Latão 473ml', qtd: 1 });
  const trio = oferta({ id: 'b', nome: '[Promo] 3x Amstel Latão 473ml', qtd: 3 });
  const pack = oferta({ id: 'c', nome: 'Pack Amstel Latão', qtd: 12, quente: true });
  const p = produto([un, trio, pack]);
  assert.equal(rotuloOferta(un, p), 'Unidade');
  assert.equal(rotuloOferta(trio, p), '3 unidades');
  assert.equal(rotuloOferta(pack, p), 'Pack c/ 12');
});

test('variações de unidade usam o sufixo depois do " - "', () => {
  const a = oferta({ id: 'a', nome: 'Água Galão Azul 20L - Somente o Líquido' });
  const b = oferta({ id: 'b', nome: 'Água Galão Azul 20L - Vasilhame Incluso' });
  const p = produto([a, b]);
  assert.equal(rotuloOferta(a, p), 'Somente o Líquido');
  assert.equal(rotuloOferta(b, p), 'Vasilhame Incluso');
});

test('cartão usa preco_cartao; pix/dinheiro usam preco', () => {
  const o = oferta({ preco: 8.75, preco_cartao: 9.5 });
  assert.equal(precoOferta(o, 'pix'), 8.75);
  assert.equal(precoOferta(o, 'dinheiro'), 8.75);
  assert.equal(precoOferta(o, 'credito'), 9.5);
  assert.equal(precoOferta(o, 'debito'), 9.5);
});

test('oferta principal prefere a unidade gelada', () => {
  const quente = oferta({ id: 'q', quente: true });
  const gelada = oferta({ id: 'g' });
  const pack = oferta({ id: 'p', qtd: 12 });
  assert.equal(ofertaPrincipal(produto([pack, quente, gelada])).id, 'g');
});
