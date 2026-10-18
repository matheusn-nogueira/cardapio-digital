// Geocodificação no servidor (A13): o navegador manda o endereço, a gente consulta
// o Nominatim identificando a loja (política de uso: User-Agent próprio, no máximo
// 1 consulta por segundo, cache) e devolve só lat/lng.
// Falha ou endereço não encontrado → { lat: null, lng: null }; o site segue e o
// banco marca "frete a confirmar".
import { NextResponse } from 'next/server';

const USER_AGENT = 'CasaDosFundos-Cardapio/1.0 (+https://cardapio.casadosfundos.cloud)';
const INTERVALO_MS = 1100; // 1 consulta/s em todo o servidor
const TEMPO_LIMITE_MS = 6000;
const CACHE_ACHADO_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_NAO_ACHADO_MS = 6 * 60 * 60 * 1000;
const CACHE_MAXIMO = 1000;

type Ponto = { lat: number; lng: number };

// Cache em memória do processo (o servidor é um container só).
const cache = new Map<string, { ponto: Ponto | null; expira: number }>();
let fila: Promise<unknown> = Promise.resolve();
let ultimaConsulta = 0;

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Enfileira as consultas para respeitar o intervalo mínimo entre elas. */
function naFila<T>(tarefa: () => Promise<T>): Promise<T> {
  const vez = fila.then(async () => {
    const falta = ultimaConsulta + INTERVALO_MS - Date.now();
    if (falta > 0) await esperar(falta);
    try {
      return await tarefa();
    } finally {
      ultimaConsulta = Date.now();
    }
  });
  fila = vez.catch(() => undefined);
  return vez;
}

/** null = não achou; lança erro se o serviço falhar (aí não guarda no cache). */
async function consultarNominatim(q: string): Promise<Ponto | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`nominatim ${r.status}`);
  const dados = (await r.json()) as { lat: string; lon: string }[];
  if (!dados.length) return null;
  const lat = parseFloat(dados[0].lat);
  const lng = parseFloat(dados[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function guardar(chave: string, ponto: Ponto | null) {
  if (cache.size >= CACHE_MAXIMO) cache.delete(cache.keys().next().value as string);
  cache.set(chave, { ponto, expira: Date.now() + (ponto ? CACHE_ACHADO_MS : CACHE_NAO_ACHADO_MS) });
}

const campo = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 120) : '');

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: 'corpo inválido' }, { status: 400 });
  }
  const rua = campo(corpo.rua);
  const numero = campo(corpo.numero);
  const bairro = campo(corpo.bairro);
  const cidade = [campo(corpo.cidade) || 'Rio de Janeiro', campo(corpo.uf) || 'RJ'].join(', ');
  if (!rua) return NextResponse.json({ erro: 'rua obrigatória' }, { status: 400 });

  // Tenta com número; se não achar, só rua/bairro (mesmo padrão do ERP).
  const tentativas = [
    [rua, numero, bairro, cidade],
    [rua, bairro, cidade],
  ].map((partes) => partes.filter(Boolean).join(', '));

  const chave = tentativas[0].toLowerCase();
  const guardado = cache.get(chave);
  if (guardado && guardado.expira > Date.now()) {
    return NextResponse.json({ lat: guardado.ponto?.lat ?? null, lng: guardado.ponto?.lng ?? null });
  }

  let falhou = false;
  for (const q of tentativas) {
    try {
      const ponto = await naFila(() => consultarNominatim(q));
      if (ponto) {
        guardar(chave, ponto);
        return NextResponse.json(ponto);
      }
    } catch {
      falhou = true; // segue para a próxima tentativa
    }
  }
  if (!falhou) guardar(chave, null);
  return NextResponse.json({ lat: null, lng: null, falhou });
}
