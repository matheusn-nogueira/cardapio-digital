'use client';

// Compartilhar o cardápio ou um produto (28/10/2026, divulgação). No celular abre a folha de
// compartilhar do aparelho (WhatsApp, Instagram, Telegram...); sem ela (computador, navegador
// antigo) copia o texto com o link e avisa no toast. A prévia do link (foto, nome e preço) vem
// das imagens Open Graph: src/app/opengraph-image.tsx e src/app/produto/[id]/opengraph-image.tsx.
import { toastEvent } from '@/components/ui/Toast';
import { vibrarLeve } from './toque';

export async function compartilhar({ titulo, texto, url }: { titulo: string; texto: string; url: string }): Promise<void> {
  const dados = { title: titulo, text: texto, url };
  if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(dados))) {
    try {
      await navigator.share(dados);
      return;
    } catch (e) {
      // fechou a folha sem escolher: nada a fazer
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${texto} ${url}`);
    vibrarLeve();
    toastEvent.show('Link copiado. Cole no WhatsApp ou onde quiser.');
  } catch {
    toastEvent.show(`Copie o link: ${url}`);
  }
}
