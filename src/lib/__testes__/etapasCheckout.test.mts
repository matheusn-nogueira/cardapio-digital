import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enderecoDoNominatim, prontoParaConfirmar, validarDados, validarEndereco } from '../etapasCheckout.ts';
import type { Endereco } from '../tipos.ts';

const endereco: Endereco = {
  cep: '21710-000', rua: 'Rua Bernardo de Vasconcelos', numero: '123', complemento: '', bairro: 'Realengo',
  cidade: 'Rio de Janeiro', uf: 'RJ', referencia: '', latitude: -22.88, longitude: -43.43,
};

test('dados: nome com 2 letras e WhatsApp com DDD', () => {
  assert.deepEqual(validarDados({ nome: 'Maria', telefone: '21999998888' }), {});
  const erros = validarDados({ nome: ' M ', telefone: '99998888' });
  assert.ok(erros.nome && erros.telefone);
});

test('endereço: rua e número obrigatórios', () => {
  assert.deepEqual(validarEndereco(endereco), {});
  assert.deepEqual(Object.keys(validarEndereco({ ...endereco, rua: ' ', numero: '' })).sort(), ['numero', 'rua']);
});

test('quem já pediu vai direto para a confirmação só com frete válido', () => {
  const cliente = { nome: 'Maria', telefone: '21999998888' };
  const frete = { distancia_km: 1.2, frete: 5, bloqueado: false };
  assert.equal(prontoParaConfirmar(cliente, endereco, frete), true);
  assert.equal(prontoParaConfirmar(cliente, endereco, null), false);
  assert.equal(prontoParaConfirmar(cliente, endereco, { ...frete, bloqueado: true }), false);
  assert.equal(prontoParaConfirmar({ nome: '', telefone: '' }, endereco, frete), false);
  // endereço não achado no mapa (frete a confirmar) também segue
  assert.equal(prontoParaConfirmar(cliente, endereco, { distancia_km: null, frete: null, bloqueado: false }), true);
});

test('localização: lê rua, bairro, cidade, UF e CEP do Nominatim reverso', () => {
  const r = enderecoDoNominatim({
    address: {
      road: 'Rua Bernardo de Vasconcelos', house_number: '120', suburb: 'Realengo', city: 'Rio de Janeiro',
      state: 'Rio de Janeiro', 'ISO3166-2-lvl4': 'BR-RJ', postcode: '21710000',
    },
  });
  assert.deepEqual(r, {
    rua: 'Rua Bernardo de Vasconcelos', numero: '120', bairro: 'Realengo', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '21710-000',
  });
});

test('localização sem rua (praça, mata, erro do GPS) volta null: a pessoa digita o CEP', () => {
  assert.equal(enderecoDoNominatim({ address: { suburb: 'Realengo', city: 'Rio de Janeiro' } }), null);
  assert.equal(enderecoDoNominatim({ error: 'Unable to geocode' }), null);
  assert.equal(enderecoDoNominatim(null), null);
});

test('localização: UF pelo nome do estado e CEP incompleto descartado', () => {
  const r = enderecoDoNominatim({ address: { road: 'Estrada do Engenho Novo', neighbourhood: 'Padre Miguel', state: 'Rio de Janeiro', postcode: '217' } });
  assert.equal(r?.uf, 'RJ');
  assert.equal(r?.cep, '');
  assert.equal(r?.bairro, 'Padre Miguel');
});
