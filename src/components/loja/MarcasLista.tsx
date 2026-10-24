import Image from 'next/image';
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

export interface MarcaVitrine {
  nome: string;
  /** Foto de um produto da marca (não há logos no banco); null = só o nome. */
  imagem_url: string | null;
}

/** Atalhos de marca: quadrado com a foto de um produto e o nome embaixo. */
export const MarcasLista: React.FC<{ marcas: MarcaVitrine[] }> = ({ marcas }) => {
  if (!marcas.length) return null;
  return (
    <section className="pt-4 pb-6" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas" className="px-4 text-[14px] font-medium uppercase tracking-wide text-rotulo mb-3">
        Marcas que temos
      </h2>
      <ul className="flex gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 snap-x">
        {marcas.map((marca) => (
          <li key={marca.nome} className="shrink-0 snap-start w-[96px]">
            <Link href={`/busca?marca=${encodeURIComponent(marca.nome)}`} className="flex flex-col items-center gap-1.5">
              <span
                className={`w-[96px] h-[84px] rounded-xl flex items-center justify-center overflow-hidden ${
                  marca.imagem_url ? 'bg-white border-2 border-[#EFEFEF] shadow-cartao' : 'bg-bloco'
                }`}
                aria-hidden="true"
              >
                {marca.imagem_url ? (
                  <Image src={marca.imagem_url} alt="" width={192} height={168} quality={70} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="px-1 text-center font-condensed font-bold uppercase text-[16px] leading-[1.05] text-tinta break-words">
                    {marca.nome}
                  </span>
                )}
              </span>
              <span className="w-full text-center text-[12.5px] font-bold text-[#4A4A4A] leading-tight line-clamp-1">{marca.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
