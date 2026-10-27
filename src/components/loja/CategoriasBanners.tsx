import React from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';
import { corDaLata } from './MarcasLista';

// Uma cor sólida por tipo de bebida, todas escuras o bastante para o texto branco (3:1 ou mais em
// letra grande). [fundo, texto]; promoções no azul-noite com o amarelo de destaque.
const CORES_TIPO: [RegExp, [string, string]][] = [
  [/promo/i, ['#0A2540', '#FFD200']],
  [/cervej/i, ['#8C5A00', '#FFFFFF']],
  [/gelo|carv/i, ['#1F6FA8', '#FFFFFF']],
  [/drink/i, ['#A62A62', '#FFFFFF']],
  [/gin/i, ['#1C7468', '#FFFFFF']],
  [/vodka|cacha/i, ['#44546A', '#FFFFFF']],
  [/whisk|licor|conhaque|destilad/i, ['#6B3E1E', '#FFFFFF']],
  [/vinho|espumante/i, ['#6E1838', '#FFFFFF']],
  [/energ|isot/i, ['#3D7419', '#FFFFFF']],
  [/refri/i, ['#B8322A', '#FFFFFF']],
  [/água|agua|suco|ch[áa]/i, ['#1D6FA0', '#FFFFFF']],
  [/bombon|doce/i, ['#6A3FA0', '#FFFFFF']],
  [/tabac/i, ['#3A3A3A', '#FFFFFF']],
];

/**
 * A cor do tipo vem primeiro (a lista das latas tem "cachaça" genérica); marca com categoria própria
 * (Império, Heineken…) não casa com tipo nenhum e fica com a cor da lata, como nas marcas da home.
 */
function coresDaCategoria(nome: string): [string, string] {
  return CORES_TIPO.find(([re]) => re.test(nome))?.[1] ?? corDaLata(nome) ?? ['#0F3A63', '#FFFFFF'];
}

/**
 * Todas as categorias como banners de cor sólida, como a tela de busca do iFood antigo (dono,
 * 27/10/2026): só o nome, em letra condensada, sem foto de produto (pedido do dono). A primeira
 * (promoções) ocupa a linha inteira.
 */
export const CategoriasBanners: React.FC<{ categorias: Categoria[] }> = ({ categorias }) => (
  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {categorias.map((cat, i) => {
      const [fundo, texto] = coresDaCategoria(cat.nome);
      return (
        <li key={cat.id} className={i === 0 ? 'col-span-2' : undefined}>
          <Link
            href={`/categoria/${cat.id}`}
            style={{ background: fundo, color: texto }}
            // fundo claro (lata branca da Stella e da Corona) ganha o fio fino dos cartões
            className="flex items-end h-[88px] p-3 rounded-2xl shadow-cartao font-condensed text-[20px] font-extrabold uppercase leading-[1.05] active:scale-[0.98] transition-transform"
          >
            {cat.nome}
          </Link>
        </li>
      );
    })}
  </ul>
);
