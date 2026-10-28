'use client';

import { useEffect } from 'react';

// Foco preso nas folhas (28/10/2026, revisão de UX): com uma janela `aria-modal` aberta (ficha,
// sacola, pop-ups, convites, idade), o resto da página fica `inert`, então o Tab e o leitor de
// tela não escapam para a página de trás. Vale para todas as folhas sem mexer em cada uma: observa
// o DOM e, quando aparece uma, marca como inerte tudo o que não é ela nem um ancestral dela.
// A folha de cima é a da camada (z-index) mais alta; na mesma camada, a que abriu por último.
// A sacola marca `data-manter-barra`: com ela aberta, o que tem `data-sempre-ativo` (a barra de
// abas, que fica visível por cima) continua clicável. Nas outras folhas a barra fica coberta e inerte.

const MARCA = 'data-inerte-pela-folha';

function liberar() {
  document.querySelectorAll(`[${MARCA}]`).forEach((el) => {
    el.removeAttribute('inert');
    el.removeAttribute(MARCA);
  });
}

/** Maior z-index entre a folha e os ancestrais dela (o z fica no invólucro `fixed`). */
function camada(folha: Element): number {
  let maior = 0;
  for (let el: Element | null = folha; el && el !== document.body; el = el.parentElement) {
    const z = parseInt(getComputedStyle(el).zIndex, 10);
    if (z > maior) maior = z;
  }
  return maior;
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
    // folhas na ordem em que abriram, para desempatar quando estão na mesma camada
    let ordem: Element[] = [];
    const conferir = () => {
      const folhas = [...document.querySelectorAll('[aria-modal="true"]')];
      const novas = folhas.filter((f) => !ordem.includes(f));
      ordem = [...ordem.filter((f) => folhas.includes(f)), ...novas];
      // a de cima é a da camada mais alta (pop-up z-200 fica sobre a ficha z-150 mesmo tendo
      // aberto antes); na mesma camada, a que abriu por último
      const atual = ordem.reduce<Element | null>((topo, f) => (!topo || camada(f) >= camada(topo) ? f : topo), null);
      // folha nova por baixo da de cima (a ficha aberta com o pop-up na tela) também fica inerte
      if (atual === aberta && !novas.length) return;
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
