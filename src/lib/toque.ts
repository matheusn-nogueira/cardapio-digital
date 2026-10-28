'use client';

import { useState } from 'react';

/**
 * Vibração curtinha ao pôr item na sacola, como a resposta tátil dos apps nativos. Só o Android
 * vibra pela web; no iPhone e no computador a chamada não existe e nada acontece.
 */
export function vibrarLeve(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
  } catch {
    // navegador que recusa vibrar (aba em segundo plano, permissão): segue sem
  }
}

/**
 * Conta cada vez que `valor` sobe, para o número da sacola dar um pulinho (`key={pulo}` refaz a
 * animação). Começa em 0: ao abrir a página, com a sacola já cheia, não pula.
 */
export function usePulo(valor: number): number {
  const [anterior, setAnterior] = useState(valor);
  const [pulo, setPulo] = useState(0);
  // ajuste de estado durante o render (sem effect), como no campo de busca do topo
  if (valor !== anterior) {
    setAnterior(valor);
    if (valor > anterior) setPulo((p) => p + 1);
  }
  return pulo;
}
