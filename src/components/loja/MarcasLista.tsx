import React from 'react';
import Link from 'next/link';
import logos from '@/data/marcas-logos.json';
import type { Produto } from '@/lib/tipos';

// Logos baixados pelo scripts/baixar-logos-marcas.py (public/marcas/); marca sem logo vira letreiro.
// arquivoLata: versão recolorida como impressa na lata (Heineken: nome branco e estrela vermelha)
const LOGOS = logos as Record<string, { arquivo: string; arquivoLata?: string; fonte: string }>;

/**
 * Marcas reais do catálogo (campo `marca`), ignorando as que são só o nome
 * da categoria (ex.: "Refrigerante") e as que têm um produto só.
 */
// "Marca" que na verdade é tipo de produto no cadastro ("Água Tônica", "Gelo") fica de fora.
const NAO_E_MARCA = /^(água|agua|gelo|refrigerante|cerveja|vinho|suco|energético|energetico)\b/i;

export function marcasDoCatalogo(produtos: Produto[], minimo = 2): string[] {
  const categorias = new Set(produtos.map((p) => p.categoria.toLowerCase()));
  const contagem = new Map<string, number>();
  for (const p of produtos) {
    const marca = p.marca?.trim();
    if (!marca || categorias.has(marca.toLowerCase()) || NAO_E_MARCA.test(marca)) continue;
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
  // cores da LATA de cada marca (Corona e Stella são latas brancas/creme)
  [/stella/i, ['#F3EFE4', '#C8102E']],
  [/budweiser|bud\b/i, ['#C8102E', '#FFFFFF']],
  [/corona/i, ['#F3EFE4', '#0B2545']],
  [/spaten/i, ['#0F5A32', '#FFFFFF']],
  [/imp[eé]rio/i, ['#1A1A1A', '#D4A017']],
  [/itaipava/i, ['#C8102E', '#FFFFFF']],
  [/caracu/i, ['#111111', '#FFFFFF']],
  [/michelob/i, ['#F2F2F2', '#1B2A4A']],
  [/beats/i, ['#1E2BC2', '#FFFFFF']],
  [/petra/i, ['#1A1A1A', '#C9A227']],
  // Bohemia: lata branca com o nome em preto; Eisenbahn: lata escura
  [/bohemia/i, ['#F2F0EA', '#1A1A1A']],
  [/eisenbahn/i, ['#1A1A1A', '#FFFFFF']],
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

// Logo como impresso na lata, com a divisão de cores dele: cores originais mesmo em fundo escuro
// (dourado da Império, selos da Amstel e da Spaten, Heineken branca com a estrela vermelha).
// A gravata da Budweiser é vermelha com texto branco: na lata vermelha ganha um contorno branco.
const LOGO_ORIGINAL = [/imp[eé]rio/i, /amstel/i, /spaten/i, /heineken/i, /antarctica/i, /itaipava/i, /eisenbahn/i, /caracu/i];
const LOGO_CONTORNO = [/budweiser/i];

function fundoClaro(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6;
}

const MINIMO_DUAS_LINHAS = 8;

/**
 * Atalhos de marca como no Zé: fundo sólido na cor da lata e o logo como impresso nela.
 * Sem degradê nem brilho (pedido do dono, 26/10/2026). Sem logos, letreiros.
 */
export const MarcasLista: React.FC<{ marcas: string[] }> = ({ marcas }) => {
  // todas as marcas entram (antes só as com logo, e Antarctica, Michelob e outras sumiam):
  // quem não tem logo vira letreiro nas cores da lata
  const lista = marcas;
  if (!lista.length) return null;
  const duasLinhas = lista.length >= MINIMO_DUAS_LINHAS;
  return (
    <section className="pt-2 pb-7" aria-labelledby="titulo-marcas">
      <h2 id="titulo-marcas" className="px-4 text-[21px] font-bold text-tinta tracking-tight mb-3">
        Marcas que temos
      </h2>
      <ul
        className={`grid grid-flow-col auto-cols-[92px] gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1 snap-x ${
          duasLinhas ? 'grid-rows-2' : 'grid-rows-1'
        }`}
      >
        {lista.map((marca, i) => {
          const logo = LOGOS[marca];
          const [fundo, texto] = coresDaMarca(marca, i);
          if (logo) {
            // fundo chapado na cor da marca; em fundo escuro o logo vira silhueta branca (como no Zé),
            // salvo os que têm cor própria que funciona no escuro
            const contorno = LOGO_CONTORNO.some((re) => re.test(marca));
            const branco = !contorno && !fundoClaro(fundo) && !LOGO_ORIGINAL.some((re) => re.test(marca));
            return (
              <li key={marca} className="snap-start">
                <Link
                  href={`/busca?marca=${encodeURIComponent(marca)}`}
                  aria-label={marca}
                  className="relative flex items-center justify-center w-[92px] h-[92px] rounded-2xl overflow-hidden p-2"
                  style={{ background: fundo }}
                >
                  {/* svg/png estático: <img> simples, sem otimizador */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/marcas/${logo.arquivoLata ?? logo.arquivo}`}
                    alt=""
                    className={`relative w-full h-full object-contain ${
                      branco
                        ? '[filter:brightness(0)_invert(1)]'
                        : contorno
                          ? '[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)]'
                          : ''
                    }`}
                  />
                </Link>
              </li>
            );
          }
          // palavra comprida ("Antarctica") diminui em vez de quebrar no meio
          const comprida = marca.split(/\s+/).some((p) => p.length > 8);
          return (
            <li key={marca} className="snap-start">
              <Link
                href={`/busca?marca=${encodeURIComponent(marca)}`}
                className="relative flex items-center justify-center w-[92px] h-[92px] rounded-2xl overflow-hidden px-2 text-center"
                style={{ background: fundo, color: texto }}
              >
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
