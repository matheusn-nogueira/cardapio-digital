// Testes do envio do pedido com fetch FALSO — nunca chamam o Supabase de verdade
// (cardapio_criar_pedido cria pedido real no ERP). Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroPedido, enviarPedido, extrairCodigoErro, montarPayloadPedido, novaChave } from '../pedido.ts';
import type { Endereco } from '../tipos.ts';

const endereco: Endereco = {
  cep: '21710-000',
  rua: ' Rua Costa Rubim ',
  numero: '10',
  complemento: '',
  bairro: 'Realengo',
  cidade: 'Rio de Janeiro',
  uf: 'rj',
  referencia: '',
  latitude: -22.88,
  longitude: -43.43,
};

const conexao = { url: 'https://exemplo.invalid/rest/v1/rpc/cardapio_criar_pedido', cabecalhos: { apikey: 'teste' } };

function respostaFalsa(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

test('monta o payload com produto + unidades, chave e total esperado, limpando os dados', () => {
  const p = montarPayloadPedido({
    cliente: { nome: ' Ana ', telefone: '(21) 99999-0000' },
    endereco,
    itens: [{ product_id: 'prod-1', unidades: 13 }, { oferta_id: 'of-natural', quantidade: 2 }],
    pagamento: 'pix',
    trocoPara: 50,
    observacoes: '  ',
    chave: 'chave-1',
    totalEsperado: 52.499999,
  });
  assert.deepEqual(p.cliente, { nome: 'Ana', telefone: '21999990000' });
  assert.equal(p.endereco.cep, '21710000');
  assert.equal(p.endereco.rua, 'Rua Costa Rubim');
  assert.equal(p.endereco.uf, 'RJ');
  assert.deepEqual(p.itens, [{ product_id: 'prod-1', unidades: 13 }, { oferta_id: 'of-natural', quantidade: 2 }]);
  assert.equal(p.chave, 'chave-1');
  assert.equal(p.total_esperado, 52.5);
  assert.equal(p.troco_para, null, 'troco só vale para dinheiro');
  assert.equal(p.observacoes, '');
  assert.ok(!/"(preco|unit_price|subtotal)"/.test(JSON.stringify(p)), 'o navegador nunca manda preço de item');
});

test('envia { p: payload } por POST e devolve a resposta do banco', async () => {
  let chamada: { url: string; init: RequestInit } | null = null;
  const fetchFalso = (async (url: string, init: RequestInit) => {
    chamada = { url, init };
    return respostaFalsa(200, { pedido_id: 'abc', numero: 7, subtotal: 54, frete: 6, total: 60 });
  }) as unknown as typeof fetch;

  const payload = montarPayloadPedido({
    cliente: { nome: 'Ana', telefone: '21999990000' },
    endereco,
    itens: [{ product_id: 'prod-1', unidades: 1 }],
    pagamento: 'dinheiro',
    trocoPara: 100,
    observacoes: 'Interfone 2',
    chave: 'chave-2',
    totalEsperado: 60,
  });
  const r = await enviarPedido(payload, conexao, fetchFalso);

  assert.deepEqual(r, { pedido_id: 'abc', numero: 7, subtotal: 54, frete: 6, total: 60, repetido: false });
  assert.ok(chamada);
  const { url, init } = chamada as { url: string; init: RequestInit };
  assert.equal(url, conexao.url);
  assert.equal(init.method, 'POST');
  const corpo = JSON.parse(String(init.body));
  assert.equal(corpo.p.pagamento, 'dinheiro');
  assert.equal(corpo.p.troco_para, 100);
  assert.equal(corpo.p.chave, 'chave-2');
  assert.equal(corpo.p.total_esperado, 60);
  assert.ok(init.signal, 'chamada tem limite de tempo');
});

test('traduz os códigos de erro do banco em mensagens amigáveis', async () => {
  const codigos = [
    'LOJA_FECHADA',
    'CARRINHO_VAZIO',
    'OFERTA_INDISPONIVEL',
    'PEDIDO_MINIMO',
    'FORA_DA_AREA',
    'DADOS_INVALIDOS',
    'PAGAMENTO_INVALIDO',
    'PRECO_MUDOU',
  ];
  for (const codigo of codigos) {
    const fetchFalso = (async () =>
      respostaFalsa(400, { code: 'P0001', message: codigo, details: null, hint: null })) as unknown as typeof fetch;
    await assert.rejects(
      enviarPedido(montarPayloadPedido({
        cliente: { nome: 'Ana', telefone: '21999990000' },
        endereco,
        itens: [{ product_id: 'x', unidades: 1 }],
        pagamento: 'pix',
        trocoPara: null,
        observacoes: '',
        chave: 'c',
        totalEsperado: 10,
      }), conexao, fetchFalso),
      (e: unknown) => e instanceof ErroPedido && e.codigo === codigo && !e.message.includes('_'),
    );
  }
});

test('erro de rede e erro desconhecido viram mensagem genérica', async () => {
  const semRede = (async () => {
    throw new TypeError('Failed to fetch');
  }) as unknown as typeof fetch;
  const payload = montarPayloadPedido({
    cliente: { nome: 'Ana', telefone: '21999990000' },
    endereco,
    itens: [{ product_id: 'x', unidades: 1 }],
    pagamento: 'pix',
    trocoPara: null,
    observacoes: '',
    chave: 'c',
    totalEsperado: 10,
  });
  await assert.rejects(enviarPedido(payload, conexao, semRede), (e: unknown) => e instanceof ErroPedido && e.codigo === 'SEM_CONEXAO');
  assert.equal(extrairCodigoErro({ message: 'algo estranho' }), 'DESCONHECIDO');
  assert.equal(extrairCodigoErro(null), 'DESCONHECIDO');
});

const payloadBase = () =>
  montarPayloadPedido({
    cliente: { nome: 'Ana', telefone: '21999990000' },
    endereco,
    itens: [{ product_id: 'x', unidades: 4 }],
    pagamento: 'cartao',
    trocoPara: null,
    observacoes: '',
    chave: 'c',
    totalEsperado: 17.5,
  });

test('PRECO_MUDOU traz os valores novos do banco (DETAIL)', async () => {
  const fetchFalso = (async () =>
    respostaFalsa(400, {
      code: 'P0001',
      message: 'PRECO_MUDOU',
      details: '{"frete": 5.00, "total": 23.25, "subtotal": 18.25}',
      hint: null,
    })) as unknown as typeof fetch;
  await assert.rejects(enviarPedido(payloadBase(), conexao, fetchFalso), (e: unknown) => {
    assert.ok(e instanceof ErroPedido);
    assert.equal(e.codigo, 'PRECO_MUDOU');
    assert.deepEqual(e.totais, { subtotal: 18.25, frete: 5, total: 23.25 });
    return true;
  });
});

test('reenvio com a mesma chave devolve o pedido marcado como repetido', async () => {
  const fetchFalso = (async () =>
    respostaFalsa(200, { pedido_id: 'abc', numero: 7, subtotal: 17.5, frete: 5, total: 22.5, repetido: true })) as unknown as typeof fetch;
  const r = await enviarPedido(payloadBase(), conexao, fetchFalso);
  assert.equal(r.repetido, true);
});

test('conexão lenta: aborta no limite de tempo com erro próprio', async () => {
  const lento = ((_url: string, init: RequestInit) =>
    new Promise((_ok, falha) => {
      init.signal?.addEventListener('abort', () => falha(new DOMException('abortado', 'AbortError')));
    })) as unknown as typeof fetch;
  await assert.rejects(enviarPedido(payloadBase(), conexao, lento, 30), (e: unknown) => {
    assert.ok(e instanceof ErroPedido);
    assert.equal(e.codigo, 'TEMPO_ESGOTADO');
    assert.match(e.message, /Conexão lenta/);
    return true;
  });
});

test('chave do pedido é um uuid v4', () => {
  const a = novaChave();
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(a, novaChave());
});
