#!/usr/bin/env node
// Cartão com QR code do cardápio para imprimir (28/10/2026, divulgação): sacola, geladeira, balcão.
// 10×15 cm, nas cores Freezer: topo azul-noite com a logo, QR grande, link e o @ do Instagram.
// Gera divulgacao/cartao-qrcode.html, .pdf (para a gráfica) e .png (para mandar no WhatsApp),
// além do QR solto em SVG. Usa o Chrome instalado para o PDF e o PNG.
//
// Uso: node scripts/cartao-qrcode.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'divulgacao');
const URL_CARDAPIO = 'https://cardapio.casadosfundos.cloud';
const INSTAGRAM = 'deliverydosfundos';
const LOGO =
  'https://dkbvmqnrdgnhiyhtgsjy.supabase.co/storage/v1/object/public/public-assets/logos/logo_casa_dos_fundos_1792289403.png';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// correção H (30%): o QR continua lendo mesmo amassado ou com respingo
const qr = await QRCode.toString(URL_CARDAPIO, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 0,
  color: { dark: '#0A2540', light: '#FFFFFF' },
});

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@500;600;700&display=block" rel="stylesheet">
<style>
  @page { size: 100mm 150mm; margin: 0 }
  * { box-sizing: border-box; margin: 0 }
  html, body { width: 100mm; height: 150mm; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { font-family: Barlow, sans-serif; color: #0A2540; background: #fff; display: flex; flex-direction: column; overflow: hidden }
  .topo { background: #0A2540; color: #fff; display: flex; align-items: center; gap: 3.5mm; padding: 5mm 6mm }
  .topo img { width: 15mm; height: 15mm; object-fit: contain }
  .nome { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 8.2mm; line-height: 1; white-space: nowrap; text-transform: uppercase; letter-spacing: .02em }
  .slogan { font-size: 3.4mm; color: #A9C3DA; margin-top: 1mm }
  .meio { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm 8mm 3mm; text-align: center }
  .chamada { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 9mm; line-height: 1; text-transform: uppercase }
  .sub { font-size: 3.8mm; color: #4A6075; margin-top: 1.5mm }
  .qr { width: 56mm; height: 56mm; margin-top: 4mm; padding: 3mm; border: .6mm solid #DCE7EF; border-radius: 4mm }
  .qr svg { width: 100%; height: 100% }
  .link { font-weight: 700; font-size: 3.8mm; margin-top: 3.5mm }
  .base { flex: none; background: #F2F7FA; border-top: .3mm solid #DCE7EF; display: flex; align-items: center; justify-content: center; gap: 2.5mm; padding: 4.5mm; font-size: 4mm }
  .base svg { width: 5.5mm; height: 5.5mm }
  .base strong { font-weight: 700 }
</style></head>
<body>
  <div class="topo">
    <img src="${LOGO}" alt="">
    <div><div class="nome">Casa dos Fundos</div><div class="slogan">Adega com delivery · Realengo</div></div>
  </div>
  <div class="meio">
    <div class="chamada">Peça gelada pelo cardápio</div>
    <div class="sub">Aponte a câmera do celular para o código</div>
    <div class="qr">${qr}</div>
    <div class="link">cardapio.casadosfundos.cloud</div>
  </div>
  <div class="base">
    <svg viewBox="0 0 24 24" fill="none" stroke="#0A2540" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r=".6" fill="#0A2540"/></svg>
    <span>Poste o brinde e marque <strong>@${INSTAGRAM}</strong></span>
  </div>
</body></html>`;

mkdirSync(SAIDA, { recursive: true });
const arquivoHtml = path.join(SAIDA, 'cartao-qrcode.html');
writeFileSync(arquivoHtml, html);
writeFileSync(path.join(SAIDA, 'qrcode-cardapio.svg'), qr);

const comum = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000'];
execFileSync(CHROME, [...comum, '--no-pdf-header-footer', `--print-to-pdf=${path.join(SAIDA, 'cartao-qrcode.pdf')}`, arquivoHtml], {
  stdio: 'ignore',
});
// PNG em 3x: 100×150 mm a 96 dpi = 378×567 px de tela
execFileSync(
  CHROME,
  [...comum, '--force-device-scale-factor=3', '--window-size=378,567', `--screenshot=${path.join(SAIDA, 'cartao-qrcode.png')}`, arquivoHtml],
  { stdio: 'ignore' },
);
console.log(`Cartão gerado em ${path.relative(RAIZ, SAIDA)}/ (html, pdf, png e o QR solto em svg)`);
