// Service worker do cardápio: só notificações push (nada de cache offline).
// Mensagem esperada: {"title": "...", "body": "...", "url": "/categoria/..."}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Mesma chave pública de src/lib/push.ts (é pública por definição).
const VAPID_PUBLIC_KEY = 'BLknCrpvtgQEte16k9AKusC-_gbmFF84e8eSz8v6IR9deO4T-1kh7v5AF81d0in-9rfSYwFBv7lL2OegGZaGvc0';

function chaveEmBytes(base64) {
  const padrao = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(padrao);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

// O navegador pode trocar a inscrição a qualquer momento (atualização do Chrome ou
// do app instalado, limpeza do sistema). Aqui ela é refeita e gravada no banco sem
// depender de a pessoa abrir o cardápio.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const nova =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveEmBytes(VAPID_PUBLIC_KEY),
        }));
      await fetch('/api/push/inscrever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nova.toJSON(), user_agent: 'sw:pushsubscriptionchange' }),
      });
    })(),
  );
});

self.addEventListener('push', (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { body: event.data ? event.data.text() : '' };
  }
  const titulo = dados.title || 'Casa dos Fundos';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.body || '',
      icon: '/icon',
      badge: '/badge',
      data: { url: dados.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (new URL(j.url).origin === self.location.origin) {
          j.navigate(destino);
          return j.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
