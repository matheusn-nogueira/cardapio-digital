// Checkout em 3 etapas (26/10/2026), uma coisa por tela: dados → endereço → pagamento.
// Quem já pediu antes (dados, endereço e frete guardados) pula direto para a confirmação.
// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { Cliente, Endereco, ResultadoFrete } from './tipos';

const digitos = (t: string) => t.replace(/\D/g, '');

export type ErrosDados = Partial<Record<'nome' | 'telefone', string>>;
export type ErrosEndereco = Partial<Record<'rua' | 'numero', string>>;

export function validarDados(c: Cliente): ErrosDados {
  const erros: ErrosDados = {};
  if (c.nome.trim().length < 2) erros.nome = 'Informe seu nome';
  const tel = digitos(c.telefone);
  if (tel.length < 10) erros.telefone = 'Informe o WhatsApp com DDD, como (21) 99999-9999';
  return erros;
}

export function validarEndereco(e: Endereco): ErrosEndereco {
  const erros: ErrosEndereco = {};
  if (!e.rua.trim()) erros.rua = 'Informe a rua ou use o CEP';
  if (!e.numero.trim()) erros.numero = 'Informe o número (ou "s/n")';
  return erros;
}

const vazio = (o: object) => Object.keys(o).length === 0;

/** Tudo guardado e o frete vale para este endereço: pode ir direto para a confirmação. */
export function prontoParaConfirmar(c: Cliente, e: Endereco, frete: ResultadoFrete | null): boolean {
  return vazio(validarDados(c)) && vazio(validarEndereco(e)) && frete != null && !frete.bloqueado;
}

const UF_POR_ESTADO: Record<string, string> = {
  'rio de janeiro': 'RJ',
  'são paulo': 'SP',
  'minas gerais': 'MG',
  'espírito santo': 'ES',
};

export interface EnderecoDoPonto {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

/**
 * Lê a resposta do Nominatim reverso (format=jsonv2, addressdetails=1). null quando não
 * há rua: sem rua a pessoa digita o CEP. O número quase nunca vem certo do GPS; vai só
 * como sugestão e a tela sempre pede para conferir.
 */
export function enderecoDoNominatim(resposta: unknown): EnderecoDoPonto | null {
  const a = ((resposta ?? {}) as { address?: Record<string, string> }).address;
  if (!a) return null;
  const rua = a.road || a.pedestrian || a.residential || '';
  if (!rua) return null;
  const iso = a['ISO3166-2-lvl4'] ?? '';
  const uf = iso.startsWith('BR-') ? iso.slice(3) : UF_POR_ESTADO[(a.state ?? '').toLowerCase()] ?? '';
  const cep = digitos(a.postcode ?? '');
  return {
    rua,
    numero: a.house_number ?? '',
    bairro: a.suburb || a.neighbourhood || a.city_district || a.quarter || '',
    cidade: a.city || a.town || a.municipality || '',
    uf,
    cep: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : '',
  };
}
