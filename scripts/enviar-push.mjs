#!/usr/bin/env node
// Dispara uma notificação push para todo mundo que ativou no cardápio.
//
// Uso:
//   node scripts/enviar-push.mjs "Título" "Texto" [/caminho]          → mostra quantos receberiam (não envia)
//   node scripts/enviar-push.mjs "Título" "Texto" [/caminho] --enviar → envia de verdade
//   node scripts/enviar-push.mjs --contar                              → só conta os inscritos
//
// Chaves: VAPID_* do .env.local deste repo; SUPABASE_ACCESS_TOKEN do .env.local do
// pdv-balcao (API de gestão, para ler a tabela). Nenhum valor é impresso.
// Inscrição que o navegador diz não existir mais (404/410) é desativada.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import webpush from 'web-push';

const REF = 'dkbvmqnrdgnhiyhtgsjy';
const CONTATO = 'https://cardapio.casadosfundos.cloud';

function lerEnv(caminho) {
  const env = {};
  for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
    const i = linha.indexOf('=');
    if (i > 0 && !linha.trimStart().startsWith('#')) env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const raiz = new URL('..', import.meta.url).pathname;
const envLocal = lerEnv(join(raiz, '.env.local'));
const token = lerEnv(join(homedir(), 'Pessoal/pdv-balcao/.env.local')).SUPABASE_ACCESS_TOKEN;
if (!envLocal.VAPID_PUBLIC_KEY || !envLocal.VAPID_PRIVATE_KEY || !token) {
  console.error('Faltam VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY no .env.local ou SUPABASE_ACCESS_TOKEN no pdv-balcao.');
  process.exit(1);
}

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'casadosfundos-cardapio/1.0' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`Supabase respondeu ${r.status}`);
  return r.json();
}

const literal = (s) => `'${String(s).replace(/'/g, "''")}'`;

const args = process.argv.slice(2);
const enviar = args.includes('--enviar');
const contar = args.includes('--contar');
const [titulo, texto, url = '/'] = args.filter((a) => !a.startsWith('--'));

const inscritos = await sql('select id, endpoint, p256dh, auth from cardapio_push_inscricoes where ativo order by autorizado_em');
console.log(`${inscritos.length} inscrito(s) ativo(s).`);
if (contar) process.exit(0);
if (!titulo || !texto) {
  console.error('Uso: node scripts/enviar-push.mjs "Título" "Texto" [/caminho] [--enviar]');
  process.exit(1);
}
if (!url.startsWith('/')) {
  console.error('O link deve ser um caminho do cardápio, começando com / (ex.: /categoria/…).');
  process.exit(1);
}
const mensagem = JSON.stringify({ title: titulo, body: texto, url });
if (!enviar) {
  console.log(`Prévia (nada enviado): ${mensagem}\nRepita com --enviar para mandar.`);
  process.exit(0);
}

webpush.setVapidDetails(CONTATO, envLocal.VAPID_PUBLIC_KEY, envLocal.VAPID_PRIVATE_KEY);
let ok = 0;
const mortos = [];
const falhas = [];
for (const i of inscritos) {
  try {
    await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, mensagem, { TTL: 6 * 60 * 60 });
    ok++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) mortos.push(i.id);
    else falhas.push(i.id);
  }
}
const ids = (lista) => lista.map(literal).join(',');
const comErro = [...mortos, ...falhas];
if (ok) {
  await sql(
    `update cardapio_push_inscricoes set ultimo_envio = now(), falhas = 0 where ativo${comErro.length ? ` and id not in (${ids(comErro)})` : ''}`,
  );
}
if (mortos.length) await sql(`update cardapio_push_inscricoes set ativo = false, cancelado_em = now() where id in (${ids(mortos)})`);
if (falhas.length) await sql(`update cardapio_push_inscricoes set falhas = falhas + 1 where id in (${ids(falhas)})`);
console.log(`Enviadas: ${ok}. Desativadas (saíram): ${mortos.length}. Falharam: ${falhas.length}.`);
