// Fila única para o Nominatim (OpenStreetMap) em todo o servidor: a política de uso pede
// User-Agent próprio e no máximo 1 consulta por segundo. Usada pela busca do endereço
// (/api/geocodificar) e pela localização do celular (/api/endereco-do-ponto).
export const USER_AGENT = 'CasaDosFundos-Cardapio/1.0 (+https://cardapio.casadosfundos.cloud)';
const INTERVALO_MS = 1100;
export const TEMPO_LIMITE_MS = 6000;

// Fila cheia (rajada ou pico): recusa na hora em vez de deixar todo mundo esperar até estourar o
// tempo. Quem chama já trata o erro: o frete fica "a confirmar" e o GPS pede o CEP.
const MAXIMO_NA_FILA = 8;

let fila: Promise<unknown> = Promise.resolve();
let ultimaConsulta = 0;
let esperando = 0;

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Enfileira as consultas para respeitar o intervalo mínimo entre elas. */
export function naFila<T>(tarefa: () => Promise<T>): Promise<T> {
  if (esperando >= MAXIMO_NA_FILA) return Promise.reject(new Error('nominatim: fila cheia'));
  esperando++;
  const vez = fila.then(async () => {
    const falta = ultimaConsulta + INTERVALO_MS - Date.now();
    if (falta > 0) await esperar(falta);
    try {
      return await tarefa();
    } finally {
      ultimaConsulta = Date.now();
      esperando--;
    }
  });
  fila = vez.catch(() => undefined);
  return vez;
}

/** GET no Nominatim com a identificação da loja; lança erro se o serviço falhar. */
export async function consultar(caminho: string): Promise<unknown> {
  const r = await fetch(`https://nominatim.openstreetmap.org/${caminho}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`nominatim ${r.status}`);
  return r.json();
}
