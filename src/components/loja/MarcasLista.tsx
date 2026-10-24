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

// Não há logos no banco: o bloco usa a cor que lembra a marca e o nome em
// tipografia pesada, como um letreiro. [fundo, texto]; quem não casa pega pela posição.
const CORES_MARCA: [RegExp, [string, string]][] = [
  [/brahma/i, ['#C8102E', '#FFFFFF']],
  [/skol/i, ['#FFD400', '#D7191C']],
  [/original/i, ['#F5C842', '#B22222']],
  [/antarctica|antartica/i, ['#0052A5', '#FFFFFF']],
  [/heineken/i, ['#007A3D', '#FFFFFF']],
  [/amstel/i, ['#B61C22', '#F0C75E']],
  [/stella/i, ['#EDEDED', '#C8102E']],
  [/budweiser|bud\b/i, ['#C8102E', '#FFFFFF']],
  [/corona/i, ['#0B2545', '#F2C94C']],
  [/spaten/i, ['#0B5D3B', '#FFFFFF']],
  [/imp[eé]rio/i, ['#1A1A1A', '#D4A017']],
  [/itaipava/i, ['#0033A0', '#FFFFFF']],
  [/michelob/i, ['#F2F2F2', '#1B2A4A']],
  [/beats/i, ['#1E2BC2', '#FFFFFF']],
  [/petra/i, ['#1A1A1A', '#C9A227']],
  [/bohemia/i, ['#7A1F2B', '#F0C75E']],
  [/eisenbahn/i, ['#1B3A6B', '#FFFFFF']],
  [/red ?bull/i, ['#F2F2F2', '#C8102E']],
  [/monster/i, ['#0A0A0A', '#95D600']],
  [/coca/i, ['#F40009', '#FFFFFF']],
  [/pepsi/i, ['#004B93', '#FFFFFF']],
  [/guaran[aá]/i, ['#0A6B3D', '#FFFFFF']],
  [/fanta/i, ['#FF8300', '#FFFFFF']],
  [/sprite/i, ['#008B47', '#FFFFFF']],
  [/crystal/i, ['#0096D6', '#FFFFFF']],
  [/gatorade/i, ['#FF6A00', '#FFFFFF']],
  [/del valle/i, ['#1A7F3C', '#FFFFFF']],
  [/smirnoff/i, ['#C8102E', '#FFFFFF']],
  [/absolut/i, ['#1F3A93', '#FFFFFF']],
  [/jack/i, ['#0A0A0A', '#FFFFFF']],
  [/johnnie|red label|black label/i, ['#0A0A0A', '#C9A227']],
  [/ballantine/i, ['#0B2E5A', '#FFFFFF']],
  [/chivas/i, ['#8B0000', '#F0C75E']],
  [/\b51\b/i, ['#FFD400', '#0033A0']],
  [/velho barreiro|cacha[cç]a/i, ['#8B4513', '#FFFFFF']],
  [/lacta/i, ['#1D2DBF', '#FFFFFF']],
  [/lay'?s|elma|doritos|ruffles/i, ['#FFD400', '#C8102E']],
  [/marlboro/i, ['#C8102E', '#FFFFFF']],
];
const CORES_SOBRA: [string, string][] = [
  ['#1A1A1A', '#FFFFFF'],
  ['#2B4C7E', '#FFFFFF'],
  ['#7A2E3B', '#FFFFFF'],
  ['#0B5D3B', '#FFFFFF'],
  ['#F6D47A', '#1A1A1A'],
];

function coresDaMarca(nome: string, indice: number): [string, string] {
  return CORES_MARCA.find(([re]) => re.test(nome))?.[1] ?? CORES_SOBRA[indice % CORES_SOBRA.length];
}

const MINIMO_DUAS_LINHAS = 8;

/** Atalhos de marca como letreiros: fundo na cor da marca e o nome em tipografia pesada, em uma ou duas linhas. */
export const MarcasLista: React.FC<{ marcas: string[] }> = ({ marcas }) => {
  if (!marcas.length) return null;
  const duasLinhas = marcas.length >= MINIMO_DUAS_LINHAS;
  return (
    <section className="pt-4 pb-6" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas" className="px-4 text-[14px] font-medium uppercase tracking-wide text-rotulo mb-3">
        Marcas que temos
      </h2>
      <ul
        className={`grid grid-flow-col auto-cols-[104px] gap-2.5 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 snap-x ${
          duasLinhas ? 'grid-rows-2' : 'grid-rows-1'
        }`}
      >
        {marcas.map((marca, i) => {
          const [fundo, texto] = coresDaMarca(marca, i);
          // palavra comprida ("Antarctica") diminui em vez de quebrar no meio
          const comprida = marca.split(/\s+/).some((p) => p.length > 8);
          return (
            <li key={marca} className="snap-start">
              <Link
                href={`/busca?marca=${encodeURIComponent(marca)}`}
                className="relative flex items-center justify-center w-[104px] h-[84px] rounded-xl overflow-hidden px-2 text-center"
                style={{ background: fundo, color: texto }}
              >
                {/* brilho leve no canto, para o bloco não parecer chapado */}
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.22), transparent 55%)' }}
                  aria-hidden="true"
                />
                <span
                  className={`relative font-condensed font-bold uppercase leading-[0.95] tracking-tight line-clamp-2 ${
                    comprida ? 'text-[17px]' : 'text-[21px]'
                  }`}
                >
                  {marca}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
