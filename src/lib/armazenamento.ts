'use client';

// Estado persistido no navegador (localStorage/sessionStorage) lido via
// useSyncExternalStore — sem setState em effect e sem erro de hidratação
// (no servidor e na hidratação vale o valor inicial). Toda leitura/escrita
// tem try/catch: aba anônima, cota cheia ou storage bloqueado não quebram o site.
import { useSyncExternalStore } from 'react';

type Ouvinte = () => void;

export interface Armazem<T> {
  ler: () => T;
  gravar: (valor: T | ((anterior: T) => T)) => void;
  assinar: (ouvinte: Ouvinte) => () => void;
  inicial: T;
}

export function criarArmazem<T>(
  chave: string,
  inicial: T,
  opcoes: { tipo?: 'local' | 'sessao'; validar?: (bruto: unknown) => T } = {},
): Armazem<T> {
  const { tipo = 'local', validar } = opcoes;
  const ouvintes = new Set<Ouvinte>();
  let valor: T = inicial;
  let carregado = false;

  const storage = (): Storage | null => {
    try {
      if (typeof window === 'undefined') return null;
      return tipo === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };

  const carregar = () => {
    carregado = true;
    try {
      const bruto = storage()?.getItem(chave);
      if (bruto == null) {
        valor = inicial;
        return;
      }
      const lido: unknown = JSON.parse(bruto);
      valor = validar ? validar(lido) : (lido as T);
    } catch {
      valor = inicial;
    }
  };

  const ler = () => {
    if (!carregado && typeof window !== 'undefined') carregar();
    return valor;
  };

  const gravar = (novo: T | ((anterior: T) => T)) => {
    valor = typeof novo === 'function' ? (novo as (anterior: T) => T)(ler()) : novo;
    carregado = true;
    try {
      storage()?.setItem(chave, JSON.stringify(valor));
    } catch {
      // sem storage: segue só em memória
    }
    ouvintes.forEach((o) => o());
  };

  const assinar = (ouvinte: Ouvinte) => {
    ouvintes.add(ouvinte);
    // outra aba mudou o mesmo dado
    const aoMudar = (e: StorageEvent) => {
      if (e.key === chave) {
        carregar();
        ouvinte();
      }
    };
    window.addEventListener('storage', aoMudar);
    return () => {
      ouvintes.delete(ouvinte);
      window.removeEventListener('storage', aoMudar);
    };
  };

  return { ler, gravar, assinar, inicial };
}

export function useArmazem<T>(armazem: Armazem<T>): [T, Armazem<T>['gravar']] {
  const valor = useSyncExternalStore(armazem.assinar, armazem.ler, () => armazem.inicial);
  return [valor, armazem.gravar];
}

const assinarNada = () => () => {};

/** false no servidor e na hidratação; true depois que o app montou no navegador. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
}
