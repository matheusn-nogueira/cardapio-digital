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
    <section className="pt-4 pb-6" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas" className="px-4 text-[14px] font-medium uppercase tracking-wide text-rotulo mb-3">
        Marcas que temos
      </h2>
      <ul className="flex gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 snap-x">
        {marcas.map((marca) => (
          <li key={marca} className="shrink-0 snap-start">
            <Link
              href={`/busca?marca=${encodeURIComponent(marca)}`}
              className="w-[112px] h-[112px] rounded-xl bg-bloco flex items-center justify-center p-2 text-center font-condensed font-bold uppercase text-[18px] leading-[1.05] text-tinta break-words"
            >
              {marca}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
