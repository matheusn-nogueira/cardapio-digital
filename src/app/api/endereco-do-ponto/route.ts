// Localização do celular → endereço (checkout, botão "Usar minha localização"). O navegador
// manda lat/lng do GPS; a gente consulta o Nominatim reverso pela fila da loja e devolve
// rua, bairro, cidade, UF e CEP. Sem rua (praça, erro do GPS) → { endereco: null } e a
// pessoa digita o CEP.
import { NextResponse } from 'next/server';
import { enderecoDoNominatim } from '@/lib/etapasCheckout';
import { consultar, naFila } from '@/lib/servidor/nominatim';

const cache = new Map<string, { resposta: ReturnType<typeof enderecoDoNominatim>; expira: number }>();
const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAXIMO = 500;

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: 'corpo inválido' }, { status: 400 });
  }
  const lat = Number(corpo.lat);
  const lng = Number(corpo.lng);
  // só o Brasil (o resto é erro ou abuso da rota)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat > 6 || lat < -34 || lng > -34 || lng < -74) {
    return NextResponse.json({ erro: 'ponto inválido' }, { status: 400 });
  }
  // ~11 m: pontos vizinhos usam a mesma consulta
  const chave = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const guardado = cache.get(chave);
  if (guardado && guardado.expira > Date.now()) return NextResponse.json({ endereco: guardado.resposta });

  try {
    const dados = await naFila(() => consultar(`reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`));
    const endereco = enderecoDoNominatim(dados);
    if (cache.size >= CACHE_MAXIMO) cache.delete(cache.keys().next().value as string);
    cache.set(chave, { resposta: endereco, expira: Date.now() + CACHE_MS });
    return NextResponse.json({ endereco });
  } catch {
    return NextResponse.json({ endereco: null, falhou: true });
  }
}
