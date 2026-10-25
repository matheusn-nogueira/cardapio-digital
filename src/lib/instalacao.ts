'use client';

// Instalação do cardápio como app (PWA). O Chrome no Android dispara
// `beforeinstallprompt` logo no começo: o evento fica guardado aqui para o botão
// "Instalar app" abrir o diálogo nativo depois. No iPhone não existe esse evento:
// a instalação é manual (Compartilhar → Adicionar à Tela de Início).
import { useSyncExternalStore } from 'react';

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Plataforma = 'ios' | 'android' | 'outro';

interface Estado {
  instalado: boolean;
  podeInstalar: boolean;
  plataforma: Plataforma;
}

const ouvintes = new Set<() => void>();
let evento: EventoInstalacao | null = null;
let instaladoAgora = false;
let iniciado = false;
let estado: Estado = { instalado: false, podeInstalar: false, plataforma: 'outro' };
const NO_SERVIDOR: Estado = { instalado: false, podeInstalar: false, plataforma: 'outro' };

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent;
  // iPadOS se apresenta como Mac, mas tem toque
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'outro';
}

/** Aberto como app instalado (tela de início). */
export function rodandoComoApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function recalcular() {
  estado = { instalado: instaladoAgora || rodandoComoApp(), podeInstalar: !!evento, plataforma: detectarPlataforma() };
  ouvintes.forEach((o) => o());
}

function iniciar() {
  if (iniciado || typeof window === 'undefined') return;
  iniciado = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // nada de mini-barra do Chrome: o banner da loja oferece na hora certa
    evento = e as EventoInstalacao;
    recalcular();
  });
  window.addEventListener('appinstalled', () => {
    instaladoAgora = true;
    evento = null;
    recalcular();
  });
  recalcular();
}

// começa a escutar assim que o módulo carrega (o evento costuma vir cedo)
if (typeof window !== 'undefined') iniciar();

function assinar(ouvinte: () => void) {
  iniciar();
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useInstalacao(): Estado {
  return useSyncExternalStore(assinar, () => estado, () => NO_SERVIDOR);
}

/** Abre o diálogo nativo de instalação (Android/Chrome). true = instalou. */
export async function instalarApp(): Promise<boolean> {
  if (!evento) return false;
  const e = evento;
  evento = null;
  recalcular();
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === 'accepted';
}
