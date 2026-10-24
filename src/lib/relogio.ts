'use client';

// Relógio de 1 minuto compartilhado, via useSyncExternalStore: no servidor e na
// hidratação devolve null (a tela bate com o que o servidor mandou); depois, o
// minuto atual, que muda a cada 60 s e faz "Fecha em 3h 24min" andar sozinho.
import { useSyncExternalStore } from 'react';

const ouvintes = new Set<() => void>();
let relogio: ReturnType<typeof setInterval> | null = null;
let minuto = Math.floor(Date.now() / 60_000);

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  if (!relogio) {
    relogio = setInterval(() => {
      minuto = Math.floor(Date.now() / 60_000);
      ouvintes.forEach((o) => o());
    }, 60_000);
  }
  return () => {
    ouvintes.delete(ouvinte);
    if (!ouvintes.size && relogio) {
      clearInterval(relogio);
      relogio = null;
    }
  };
}

const lerMinuto = () => minuto;
const noServidor = () => null;

/** Minuto atual (muda a cada 60 s); null no servidor e durante a hidratação. */
export function useMinutoAtual(): number | null {
  return useSyncExternalStore(assinar, lerMinuto, noServidor);
}
