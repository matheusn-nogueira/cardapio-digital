// Chamadas feitas pelo navegador (checkout): status atualizado da loja,
// CEP, geocodificação, frete e envio do pedido.
import { normalizarHome } from './cardapio';
import { ConexaoPedido, enviarPedido } from './pedido';
import { cabecalhosSupabase, urlRest } from './supabase';
import type { DadosHome, Endereco, PayloadPedido, RespostaPedido, ResultadoFrete } from './tipos';

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

async function consultarNominatim(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
  if (!r.ok) return null;
  const dados = (await r.json()) as { lat: string; lon: string }[];
  if (!dados.length) return null;
  const lat = parseFloat(dados[0].lat);
  const lng = parseFloat(dados[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Lat/lng do endereço pelo Nominatim (mesmo padrão do ERP). Tenta com número,
 * depois só rua/bairro. null = não achou (o banco marca "frete a confirmar").
 */
export async function geocodificar(e: Endereco): Promise<{ lat: number; lng: number } | null> {
  const cidade = [e.cidade || 'Rio de Janeiro', e.uf || 'RJ'].join(', ');
  const tentativas = [
    [e.rua, e.numero, e.bairro, cidade],
    [e.rua, e.bairro, cidade],
  ].map((partes) => partes.filter((p) => p && p.trim()).join(', '));

  for (let i = 0; i < tentativas.length; i++) {
    try {
      if (i > 0) await esperar(1100); // política de uso do Nominatim: 1 req/s
      const achado = await consultarNominatim(tentativas[i]);
      if (achado) return achado;
    } catch {
      // segue para a próxima tentativa
    }
  }
  return null;
}

/** Frete pelo banco (`cardapio_calcular_frete`, só leitura). */
export async function calcularFrete(lat: number, lng: number): Promise<ResultadoFrete> {
  const r = await fetch(urlRest('rpc/cardapio_calcular_frete'), {
    method: 'POST',
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
