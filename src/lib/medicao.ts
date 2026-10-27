'use client';

// Números do site para o dono (tela "Site" do ERP, supabase/cardapio_funil.sql):
// até onde cada visita chega no pedido e o que as pessoas buscam. Sem nome, telefone
// nem IP: a visita é um uuid sorteado por aba (sessionStorage). Cada etapa e cada
// termo vão uma vez por aba. Fora do site publicado (servidor local, prévia) não grava,
// para os testes não entrarem na conta. Falha de rede é ignorada.
import { armazemCliente } from './estado-checkout';
import { cabecalhosSupabase, urlRest } from './supabase';

export type EtapaFunil = 'visita' | 'sacola' | 'dados' | 'endereco' | 'pagamento' | 'pedido';

const CHAVE_SESSAO = 'cdf:sessao';
const CHAVE_ENVIADOS = 'cdf:medido';

function noSitePublicado(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('casadosfundos.cloud');
}

function sessao(): string | null {
  try {
    let id = window.sessionStorage.getItem(CHAVE_SESSAO);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(CHAVE_SESSAO, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Marca como enviado; devolve false se já tinha sido enviado nesta aba. */
function primeiraVez(marca: string): boolean {
  try {
    const enviados = new Set<string>(JSON.parse(window.sessionStorage.getItem(CHAVE_ENVIADOS) ?? '[]'));
    if (enviados.has(marca)) return false;
    enviados.add(marca);
    window.sessionStorage.setItem(CHAVE_ENVIADOS, JSON.stringify([...enviados].slice(-200)));
    return true;
  } catch {
    return false;
  }
}

function chamar(funcao: string, corpo: Record<string, unknown>) {
  // keepalive: o registro do "pedido" sai junto com a troca de página
  fetch(urlRest(`rpc/${funcao}`), {
    method: 'POST',
    keepalive: true,
    headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(corpo),
  }).catch(() => {});
}

export function registrarEtapa(etapa: EtapaFunil) {
  if (!noSitePublicado() || !primeiraVez(`etapa:${etapa}`)) return;
  const id = sessao();
  if (!id) return;
  const recorrente = armazemCliente.ler().telefone.replace(/\D/g, '').length >= 10;
  chamar('cardapio_funil_registrar', { p_sessao: id, p_etapa: etapa, p_recorrente: recorrente });
}

export function registrarBusca(termo: string, resultados: number, aproximado: boolean) {
  const limpo = termo.trim().toLowerCase().replace(/\s+/g, ' ');
  if (limpo.length < 2 || !noSitePublicado() || !primeiraVez(`busca:${limpo}`)) return;
  chamar('cardapio_busca_registrar', { p_termo: limpo, p_resultados: resultados, p_aproximado: aproximado });
}
