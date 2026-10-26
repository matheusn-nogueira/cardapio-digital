// Chamadas feitas pelo navegador (checkout): status atualizado da loja, preços
// atuais, CEP, geocodificação (pelo nosso servidor), frete e envio do pedido.
import type { StatusPedido } from './andamento';
import type { EnderecoDoPonto } from './etapasCheckout';
import { classificarOfertas, COLUNAS_PRODUTO, normalizarHome, normalizarProduto, paraCliente } from './cardapio';
import type { MapaOfertas } from './carrinho';
import { ConexaoPedido, enviarPedido } from './pedido';
import { cabecalhosSupabase, urlRest } from './supabase';
import type { DadosHome, Endereco, PayloadPedido, Produto, RespostaPedido, ResultadoFrete } from './tipos';

/** Home sem cache — usado no pagamento para conferir se a loja ainda está aberta. */
export async function buscarHomeAtualizada(): Promise<DadosHome | null> {
  try {
    const r = await fetch(urlRest('cardapio_vw_home?select=dados'), {
      headers: cabecalhosSupabase(),
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const linhas = (await r.json()) as { dados: Record<string, unknown> }[];
    return linhas[0]?.dados ? normalizarHome(linhas[0].dados) : null;
  } catch {
    return null;
  }
}

export interface EnderecoViaCep {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** ViaCEP: null se o CEP não existe; lança erro se a consulta falhar. */
export async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return null;
  const r = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!r.ok) throw new Error('viacep');
  const dados = await r.json();
  if (dados.erro) return null;
  return {
    rua: dados.logradouro ?? '',
    bairro: dados.bairro ?? '',
    cidade: dados.localidade ?? '',
    uf: dados.uf ?? '',
  };
}

/**
 * Lat/lng do endereço pelo nosso servidor (/api/geocodificar, que consulta o
 * Nominatim com identificação e cache). Plano B: qualquer falha ou endereço não
 * encontrado devolve null — o pedido segue sem coordenadas e o banco marca
 * "frete a confirmar".
 */
export async function geocodificar(e: Endereco): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch('/api/geocodificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rua: e.rua, numero: e.numero, bairro: e.bairro, cidade: e.cidade, uf: e.uf }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { lat?: unknown; lng?: unknown };
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    return d.lat != null && d.lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

/** Status do pedido do site para a tela de confirmação (só nas primeiras 24 h). null = sem resposta. */
export async function buscarStatusPedido(id: string): Promise<{ status: StatusPedido; retirada: boolean } | null> {
  try {
    const r = await fetch(urlRest('rpc/cardapio_status_pedido'), {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_id: id }),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { status?: StatusPedido; retirada?: boolean } | null;
    return d?.status ? { status: d.status, retirada: d.retirada === true } : null;
  } catch {
    return null;
  }
}

/** Endereço do ponto do GPS (pelo nosso servidor). null = sem rua ou serviço fora; a pessoa digita o CEP. */
export async function enderecoDoPonto(lat: number, lng: number): Promise<EnderecoDoPonto | null> {
  try {
    const r = await fetch('/api/endereco-do-ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    return ((await r.json()) as { endereco: EnderecoDoPonto | null }).endereco;
  } catch {
    return null;
  }
}

/**
 * Preços atuais (sem cache) só dos produtos da sacola — usado ao abrir o checkout e
 * o pagamento. null = não deu para conferir (segue com o catálogo da página).
 */
export async function buscarProdutosAtualizados(ids: string[]): Promise<Produto[] | null> {
  const unicos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!unicos.length) return [];
  try {
    const r = await fetch(urlRest(`cardapio_vw_produtos?select=${COLUNAS_PRODUTO}&id=in.(${unicos.join(',')})`), {
      headers: cabecalhosSupabase(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const linhas = (await r.json()) as Record<string, unknown>[];
    return linhas.map(normalizarProduto).filter((p) => p.ofertas.length > 0).map(paraCliente);
  } catch {
    return null;
  }
}

/** Mapa oferta → produto/tamanho/variante, só para migrar sacola salva no formato antigo. */
export async function buscarMapaOfertas(): Promise<MapaOfertas | null> {
  try {
    const r = await fetch(urlRest('cardapio_vw_produtos?select=id,nome_original,gelada,ofertas'), {
      headers: cabecalhosSupabase(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const linhas = (await r.json()) as Record<string, unknown>[];
    const mapa: MapaOfertas = new Map();
    for (const l of linhas) {
      const { venda, variantes } = classificarOfertas(l);
      const produtoId = String(l.id);
      for (const o of venda) mapa.set(o.id, { produtoId, qtd: o.qtd, variante: false });
      for (const o of variantes) mapa.set(o.id, { produtoId, qtd: o.qtd, variante: true });
    }
    return mapa;
  } catch {
    return null;
  }
}

/** Frete pelo banco (`cardapio_calcular_frete`, só leitura). */
export async function calcularFrete(lat: number, lng: number): Promise<ResultadoFrete> {
  const r = await fetch(urlRest('rpc/cardapio_calcular_frete'), {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p_lat: lat, p_lng: lng }),
  });
  if (!r.ok) throw new Error('frete');
  const d = await r.json();
  return {
    distancia_km: d.distancia_km == null ? null : Number(d.distancia_km),
    frete: d.frete == null ? null : Number(d.frete),
    bloqueado: d.bloqueado === true,
  };
}

const conexaoPedido: ConexaoPedido = {
  url: urlRest('rpc/cardapio_criar_pedido'),
  cabecalhos: cabecalhosSupabase(),
};

/** Cria o pedido REAL no ERP. Só chamar a partir do botão "Finalizar pedido". */
export function finalizarPedido(payload: PayloadPedido): Promise<RespostaPedido> {
  return enviarPedido(payload, conexaoPedido);
}
