import React from 'react';
import Link from 'next/link';
import type { Produto } from '@/lib/tipos';

/**
 * Marcas reais do catálogo (campo `marca`), ignorando as que são só o nome
 * da categoria (ex.: "Refrigerante") e as que têm um produto só.
 */
export function marcasDoCatalogo(produtos: Produto[], minimo = 2): string[] {
  const categorias = new Set(produtos.map((p) => p.categoria.toLowerCase()));
  const contagem = new Map<string, number>();
  for (const p of produtos) {
    const marca = p.marca?.trim();
    if (!marca || categorias.has(marca.toLowerCase())) continue;
    contagem.set(marca, (contagem.get(marca) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .filter(([, n]) => n >= minimo)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([marca]) => marca);
}

export const MarcasLista: React.FC<{ marcas: string[] }> = ({ marcas }) => {
  if (!marcas.length) return null;
  return (
    <section className="px-4 py-5 bg-white mt-2" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas" className="text-[17px] font-bold tracking-tight mb-3">
        Marcas
      </h2>
      <ul className="flex flex-wrap gap-2">
        {marcas.map((marca) => (
          <li key={marca}>
            <Link
              href={`/busca?marca=${encodeURIComponent(marca)}`}
              className="inline-flex items-center h-10 px-4 rounded-full border border-borda bg-white text-[14px] font-medium"
            >
              {marca}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
