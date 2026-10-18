import { normalizarTexto } from './formatacao';
import type { Produto } from './tipos';

/**
 * Todas as palavras do termo precisam aparecer em nome/marca/categoria/apelidos
 * (sem acento). Apelidos vêm do cadastro do produto (aliases + tags).
 */
export function filtrarPorTermo(produtos: Produto[], termo: string, extra?: (p: Produto) => string): Produto[] {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return produtos;
  return produtos.filter((p) => {
    const alvo = normalizarTexto([p.nome, p.marca ?? '', p.categoria, p.apelidos, extra?.(p) ?? ''].join(' '));
    return palavras.every((palavra) => alvo.includes(palavra));
  });
}
