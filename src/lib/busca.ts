// Módulo puro (só importa tipos) para poder ser testado com `node --test`.
import type { Produto } from './tipos';

/** Minúsculas e sem acento (o mesmo de `normalizarTexto`, repetido aqui para o teste rodar sem build). */
const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const palavrasDe = (t: string) => normalizar(t).split(/[^a-z0-9]+/).filter(Boolean);

const alvoDe = (p: Produto, extra?: (p: Produto) => string) =>
  normalizar([p.nome, p.marca ?? '', p.categoria, p.apelidos, extra?.(p) ?? ''].join(' '));

/**
 * Todas as palavras do termo precisam aparecer em nome/marca/categoria/apelidos
 * (sem acento). Apelidos vêm do cadastro do produto (aliases + tags).
 */
export function filtrarPorTermo(produtos: Produto[], termo: string, extra?: (p: Produto) => string): Produto[] {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return produtos;
  return produtos.filter((p) => {
    const alvo = alvoDe(p, extra);
    return palavras.every((palavra) => alvo.includes(palavra));
  });
}

/** Distância de edição (Levenshtein), com corte: devolve max+1 assim que passa do limite. */
function distancia(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      menor = Math.min(menor, atual[j]);
    }
    if (menor > max) return max + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/** Erros aceitos por palavra: nenhum em palavra curta ou com número (473, 350ml), 1 até 6 letras, 2 a partir de 7. */
const tolerancia = (w: string) => (/\d/.test(w) || w.length < 4 ? 0 : w.length < 7 ? 1 : 2);

/** A palavra digitada bate com alguma palavra do produto, com erro de digitação ou pela metade ("heinek"). */
function bateAproximado(w: string, palavrasAlvo: string[]): boolean {
  const tol = tolerancia(w);
  return palavrasAlvo.some(
    (t) =>
      t.startsWith(w) ||
      (tol > 0 && (distancia(w, t, tol) <= tol || (t.length > w.length && distancia(w, t.slice(0, w.length), tol) <= tol))),
  );
}

const LIGACOES = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'a', 'o', 'um', 'uma', 'pra', 'para']);

export interface ResultadoBusca {
  produtos: Produto[];
  /** Achou só com erro de digitação corrigido ou ignorando palavras: a tela avisa. */
  aproximado: boolean;
  /** Palavras que não bateram com nada e ficaram de fora ("cerveja barata" → ["barata"]). */
  ignoradas: string[];
}

/**
 * Busca da tela de busca (26/10/2026). Primeiro a busca exata; sem resultado, aceita erro de
 * digitação ("brama" → Brahma, "heinekem" → Heineken, comum em quem digita pouco no celular);
 * ainda sem resultado, ignora as palavras que não batem com produto nenhum ("cerveja barata").
 */
export function buscarProdutos(produtos: Produto[], termo: string, extra?: (p: Produto) => string): ResultadoBusca {
  const exatos = filtrarPorTermo(produtos, termo, extra);
  if (exatos.length || !normalizar(termo)) return { produtos: exatos, aproximado: false, ignoradas: [] };

  const palavras = palavrasDe(termo).filter((w) => !LIGACOES.has(w));
  if (!palavras.length) return { produtos: [], aproximado: false, ignoradas: [] };
  const alvos = produtos.map((p) => ({ p, palavras: palavrasDe(alvoDe(p, extra)) }));
  const comTodas = (ws: string[]) => alvos.filter((a) => ws.every((w) => bateAproximado(w, a.palavras))).map((a) => a.p);

  const aproximados = comTodas(palavras);
  if (aproximados.length) return { produtos: aproximados, aproximado: true, ignoradas: [] };

  const uteis = palavras.filter((w) => alvos.some((a) => bateAproximado(w, a.palavras)));
  if (!uteis.length || uteis.length === palavras.length) return { produtos: [], aproximado: false, ignoradas: [] };
  return { produtos: comTodas(uteis), aproximado: true, ignoradas: palavras.filter((w) => !uteis.includes(w)) };
}
