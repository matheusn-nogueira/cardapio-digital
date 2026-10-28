'use client';

import { useEffect } from 'react';

// Foco preso nas folhas (28/10/2026, revisão de UX): com uma janela `aria-modal` aberta (ficha,
// sacola, pop-ups, convites, idade), o resto da página fica `inert`, então o Tab e o leitor de
// tela não escapam para a página de trás. Vale para todas as folhas sem mexer em cada uma: observa
// o DOM e, quando aparece uma, marca como inerte tudo o que não é ela nem um ancestral dela.
// A sacola marca `data-manter-barra`: com ela aberta, o que tem `data-sempre-ativo` (a barra de
// abas, que fica visível por cima) continua clicável. Nas outras folhas a barra fica coberta e inerte.

const MARCA = 'data-inerte-pela-folha';

function liberar() {
  document.querySelectorAll(`[${MARCA}]`).forEach((el) => {
    el.removeAttribute('inert');
    el.removeAttribute(MARCA);
  });
}

function prenderEm(folha: Element) {
  const manterBarra = folha.hasAttribute('data-manter-barra');
  for (let el: Element | null = folha; el && el !== document.body; el = el.parentElement) {
    for (const irmao of el.parentElement?.children ?? []) {
      if (irmao === el || irmao.hasAttribute('inert') || (manterBarra && irmao.hasAttribute('data-sempre-ativo'))) continue;
      if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(irmao.tagName)) continue;
      irmao.setAttribute('inert', '');
      irmao.setAttribute(MARCA, '');
    }
  }
}

export function FocoNasFolhas() {
  useEffect(() => {
    let aberta: Element | null = null;
    const conferir = () => {
      const folhas = document.querySelectorAll('[aria-modal="true"]');
      // a última aberta é a de cima (a confirmação de idade pode vir por cima da ficha)
      const atual = folhas[folhas.length - 1] ?? null;
      if (atual === aberta) return;
      liberar();
      aberta = atual;
      if (atual) prenderEm(atual);
    };
    const observador = new MutationObserver(conferir);
    observador.observe(document.body, { childList: true, subtree: true });
    conferir();
    return () => {
      observador.disconnect();
      liberar();
    };
  }, []);
  return null;
}
