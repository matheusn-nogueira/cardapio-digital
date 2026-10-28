'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';

interface Props {
  categorias: Categoria[];
  ativaId?: string;
  /** Mantido por compatibilidade: os chips já são compactos. */
  compacta?: boolean;
  /**
   * Home: os chips grudam embaixo do topo e marcam a categoria da prateleira que está na tela,
   * como no iFood (dono, 27/10/2026). As prateleiras dizem a categoria em `data-categoria`.
   */
  acompanharRolagem?: boolean;
}

/** Chip marcado é o da prateleira cujo título já passou desta distância abaixo dos chips. */
const FOLGA_LEITURA = 48;

/** Categoria da última prateleira que já subiu até logo abaixo dos chips (null antes da primeira). */
function useCategoriaNaTela(ligado: boolean, chips: React.RefObject<HTMLElement | null>): string | null {
  const [atual, setAtual] = useState<string | null>(null);
  useEffect(() => {
    if (!ligado) return;
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const linha = (chips.current?.getBoundingClientRect().bottom ?? 0) + FOLGA_LEITURA;
      let achada: string | null = null;
      for (const secao of document.querySelectorAll<HTMLElement>('[data-categoria]')) {
        if (secao.getBoundingClientRect().top <= linha) achada = secao.dataset.categoria ?? null;
        else break;
      }
      setAtual(achada);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      window.removeEventListener('scroll', aoRolar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [ligado, chips]);
  return atual;
}

/**
 * Chips de categoria só com o nome, sem foto nem ícone (dono, 27/10/2026, Freezer). Na home o
 * primeiro (promoções) fica em destaque até a rolagem chegar às prateleiras; daí o destaque segue a
 * prateleira na tela. Na página de categoria, a categoria aberta. Todas juntas ficam na aba Busca.
 */
export const CategoriasLista: React.FC<Props> = ({ categorias, ativaId, acompanharRolagem = false }) => {
  const nav = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLUListElement>(null);
  const naTela = useCategoriaNaTela(acompanharRolagem, nav);
  const destaqueId = ativaId ?? naTela ?? categorias[0]?.id;

  // o chip marcado entra na tela dos chips, sem mexer na rolagem da página. Na página de categoria
  // a barra já abre com a categoria atual à vista (dono, 27/10/2026: tocar em Tabacaria abria a barra
  // no começo, sem mostrar onde a pessoa estava); na home, acompanha a rolagem com animação.
  const primeiraVez = useRef(true);
  useEffect(() => {
    if (!trilho.current || !destaqueId || (!acompanharRolagem && !ativaId)) return;
    const chip = trilho.current.querySelector<HTMLElement>(`[data-chip="${CSS.escape(destaqueId)}"]`);
    if (chip) {
      trilho.current.scrollTo({ left: chip.offsetLeft - 16, behavior: primeiraVez.current ? 'instant' : 'smooth' });
    }
    primeiraVez.current = false;
  }, [acompanharRolagem, ativaId, destaqueId]);

  if (!categorias.length) return null;
  return (
    <nav
      ref={nav}
      aria-label="Categorias"
      // presa embaixo do topo na home e na página de categoria: troca de categoria sem voltar ao começo
      className={`bg-white pt-3 pb-3 ${acompanharRolagem || ativaId ? 'sticky top-[var(--altura-topo,0px)] z-30' : ''}`}
    >
      <ul ref={trilho} className="flex gap-2 overflow-x-auto no-scrollbar px-4 scroll-px-4">
        {categorias.map((cat) => {
          const ativa = cat.id === ativaId;
          const destaque = cat.id === destaqueId;
          return (
            <li key={cat.id} className="shrink-0" data-chip={cat.id}>
              <Link
                href={`/categoria/${cat.id}`}
                aria-current={ativa ? 'page' : undefined}
                className={`flex items-center h-9 px-3.5 rounded-xl whitespace-nowrap text-[14px] transition-colors duration-200 ${
                  destaque ? 'bg-tinta text-white font-bold' : 'bg-bloco text-tinta font-semibold'
                }`}
              >
                {cat.nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
