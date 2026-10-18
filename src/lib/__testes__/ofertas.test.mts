import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detalheVariante,
  melhorBloco,
  precoOferta,
  rotuloOferta,
  rotuloPadrao,
  rotuloVariante,
  separarVariantes,
  tabelaDePrecos,
} from '../ofertas.ts';
import type { Oferta } from '../tipos.ts';

const oferta = (o: Partial<Oferta>): Oferta => ({ nome: 'x', qtd: 1, preco: 1, preco_cartao: 1, quente: false, ...o });

test('rótulos curtos das ofertas', () => {
  assert.equal(rotuloOferta(oferta({ nome: 'Cerveja Amstel Latão 473ml', qtd: 1 })), 'Unidade');
  assert.equal(rotuloOferta(oferta({ nome: '[Promo] 3x Amstel Latão 473ml', qtd: 3 })), '3 unidades');
  assert.equal(rotuloOferta(oferta({ nome: 'Pack Amstel Latão', qtd: 12 })), 'Pack c/ 12');
  assert.equal(rotuloOferta(oferta({ nome: 'Brahma Duplo Malte', qtd: 6 })), 'Brahma Duplo Malte c/ 6');
});

test('cartão usa preco_cartao; pix/dinheiro usam preco', () => {
  const o = oferta({ preco: 8.75, preco_cartao: 9.5 });
  assert.equal(precoOferta(o, 'pix'), 8.75);
  assert.equal(precoOferta(o, 'dinheiro'), 8.75);
  assert.equal(precoOferta(o, 'cartao'), 9.5);
});

test('tabela mostra um bloco por tamanho (o mais barato), em ordem', () => {
  const liquido = oferta({ nome: 'Galão - Somente o Líquido', preco: 8 });
  const vasilhame = oferta({ nome: 'Galão - Vasilhame Incluso', preco: 35 });
  const pack = oferta({ nome: 'Pack', qtd: 12, preco: 52 });
  assert.deepEqual(tabelaDePrecos([pack, vasilhame, liquido]), [liquido, pack]);
});

test('melhor bloco = menor preço por unidade', () => {
  const trio = oferta({ nome: '3x', qtd: 3, preco: 13 }); // 4,33
  const pack = oferta({ nome: 'Pack', qtd: 12, preco: 48 }); // 4,00
  assert.equal(melhorBloco([oferta({ preco: 4.5 }), trio, pack]), pack);
  assert.equal(melhorBloco([oferta({ preco: 4.5 })]), null);
});

test('variantes: bloco quente de produto gelado e unidade mais cara (vasilhame)', () => {
  const un = oferta({ nome: 'Cerveja Heineken Latão', preco: 6 });
  const pack = oferta({ nome: 'Pack Heineken Latão', qtd: 12, preco: 68 });
  const packQuente = oferta({ nome: 'Pack Heineken Latão', qtd: 12, preco: 64, quente: true });
  const gelada = separarVariantes([un, pack, packQuente], false);
  assert.deepEqual(gelada.venda, [un, pack]);
  assert.deepEqual(gelada.variantes, [packQuente]);
  assert.deepEqual(separarVariantes([un, pack, packQuente], true).variantes, [], 'produto quente usa tudo na combinação');

  const liquido = oferta({ nome: 'Água Galão Azul 20L - Somente o Líquido', preco: 8 });
  const vasilhame = oferta({ nome: 'Água Galão Azul 20L - Vasilhame Incluso', preco: 35 });
  const galao = separarVariantes([vasilhame, liquido], false);
  assert.deepEqual(galao.venda, [liquido]);
  assert.deepEqual(galao.variantes, [vasilhame]);

  assert.equal(rotuloVariante(packQuente), 'Natural (sem gelar)');
  assert.equal(detalheVariante(packQuente), 'Pack 12');
  assert.equal(rotuloVariante(vasilhame), 'Vasilhame incluso');
  assert.equal(detalheVariante(vasilhame), null);
  const v = (o: Oferta) => ({ ...o, id: 'x' });
  assert.equal(rotuloPadrao({ ofertas: [un, pack], variantes: [v(packQuente)] }), 'Gelada');
  assert.equal(rotuloPadrao({ ofertas: [liquido], variantes: [v(vasilhame)] }), 'Somente o líquido');
});
