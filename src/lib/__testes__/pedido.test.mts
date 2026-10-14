// Testes do envio do pedido com fetch FALSO — nunca chamam o Supabase de verdade
// (cardapio_criar_pedido cria pedido real no ERP). Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroPedido, enviarPedido, extrairCodigoErro, montarPayloadPedido } from '../pedido.ts';
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

test('monta o payload só com ids de oferta e quantidades, limpando os dados', () => {
  const p = montarPayloadPedido({
    cliente: { nome: ' Ana ', telefone: '(21) 99999-0000' },
    endereco,
    itens: [{ ofertaId: 'of-1', quantidade: 2 }],
    pagamento: 'pix',
    trocoPara: 50,
    observacoes: '  ',
  });
  assert.deepEqual(p.cliente, { nome: 'Ana', telefone: '21999990000' });
  assert.equal(p.endereco.cep, '21710000');
  assert.equal(p.endereco.rua, 'Rua Costa Rubim');
  assert.equal(p.endereco.uf, 'RJ');
  assert.deepEqual(p.itens, [{ oferta_id: 'of-1', quantidade: 2 }]);
  assert.equal(p.troco_para, null, 'troco só vale para dinheiro');
  assert.equal(p.observacoes, '');
  assert.ok(!JSON.stringify(p).includes('preco'), 'o navegador nunca manda preço');
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
    itens: [{ ofertaId: 'of-1', quantidade: 1 }],
    pagamento: 'dinheiro',
    trocoPara: 100,
    observacoes: 'Interfone 2',
  });
  const r = await enviarPedido(payload, conexao, fetchFalso);

  assert.deepEqual(r, { pedido_id: 'abc', numero: 7, subtotal: 54, frete: 6, total: 60 });
  assert.ok(chamada);
  const { url, init } = chamada as { url: string; init: RequestInit };
  assert.equal(url, conexao.url);
  assert.equal(init.method, 'POST');
  const corpo = JSON.parse(String(init.body));
  assert.equal(corpo.p.pagamento, 'dinheiro');
  assert.equal(corpo.p.troco_para, 100);
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
  ];
  for (const codigo of codigos) {
    const fetchFalso = (async () =>
      respostaFalsa(400, { code: 'P0001', message: codigo, details: null, hint: null })) as unknown as typeof fetch;
    await assert.rejects(
      enviarPedido(montarPayloadPedido({
        cliente: { nome: 'Ana', telefone: '21999990000' },
        endereco,
        itens: [{ ofertaId: 'x', quantidade: 1 }],
        pagamento: 'pix',
        trocoPara: null,
        observacoes: '',
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
    itens: [{ ofertaId: 'x', quantidade: 1 }],
    pagamento: 'pix',
    trocoPara: null,
    observacoes: '',
  });
  await assert.rejects(enviarPedido(payload, conexao, semRede), (e: unknown) => e instanceof ErroPedido && e.codigo === 'SEM_CONEXAO');
  assert.equal(extrairCodigoErro({ message: 'algo estranho' }), 'DESCONHECIDO');
  assert.equal(extrairCodigoErro(null), 'DESCONHECIDO');
});
