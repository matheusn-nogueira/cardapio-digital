'use client';

// Notificações push (Web Push). A chave pública VAPID pode ficar no código; a
// privada só existe no .env.local de quem dispara (scripts/enviar-push.mjs).
import { cabecalhosSupabase, urlRest } from './supabase';

export const VAPID_PUBLIC_KEY = 'BLknCrpvtgQEte16k9AKusC-_gbmFF84e8eSz8v6IR9deO4T-1kh7v5AF81d0in-9rfSYwFBv7lL2OegGZaGvc0';

/** Navegador aceita push aqui? (no iPhone, só com o cardápio na tela de início) */
export function pushSuportado(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Aberto como app instalado (tela de início). */
export function appInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function registrarServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

function chaveEmBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padrao = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(padrao);
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

/**
 * Pede a permissão (precisa vir de um toque da pessoa), inscreve o navegador e
 * grava no banco. Devolve false se a pessoa negou.
 */
export async function ativarPush(): Promise<boolean> {
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return false;
  await salvarInscricao();
  return true;
}

/**
 * Com a permissão já dada: garante a inscrição e (re)grava no banco. Roda a cada
 * abertura, então uma gravação que falhou antes se resolve sozinha.
 */
export async function salvarInscricao(): Promise<void> {
  const registro = await registrarServiceWorker();
  await navigator.serviceWorker.ready;
  const inscricao =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(VAPID_PUBLIC_KEY) }));
  const r = await fetch(urlRest('rpc/cardapio_push_inscrever'), {
    method: 'POST',
    headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
    // "app" ou "navegador" na frente do user agent: dá para ver de onde vêm os inscritos
    body: JSON.stringify({ p: { ...inscricao.toJSON(), user_agent: `${appInstalado() ? 'app' : 'navegador'} · ${navigator.userAgent}` } }),
  });
  if (!r.ok) throw new Error(`inscricao ${r.status}`);
}
