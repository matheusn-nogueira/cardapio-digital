'use client';

import React from 'react';
import { Instagram, Share2 } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { compartilhar } from '@/lib/compartilhar';
import { formatarPreco } from '@/lib/formatacao';
import { melhorPreco } from '@/lib/precoQuantidade';
import { INSTAGRAM, URL_INSTAGRAM } from '@/lib/site';
import type { Produto } from '@/lib/tipos';

/**
 * Divulgação (28/10/2026): compartilhar o cardápio ou um produto e o convite para postar e marcar
 * a loja no Instagram. Aparece na confirmação do pedido (o momento em que a pessoa está satisfeita),
 * na ficha do produto e em "Sobre a loja".
 */

export function useCompartilharCardapio(): () => Promise<void> {
  const { home } = useCardapio();
  const nome = home.loja.nome || 'Casa dos Fundos';
  return () =>
    compartilhar({
      titulo: nome,
      texto: `${nome}: cerveja gelada, destilados e gelo com entrega. Peça pelo cardápio:`,
      url: `${window.location.origin}/`,
    });
}

/** Ícone redondo de compartilhar o produto, ao lado do "Fechar" da ficha e do "Voltar" da página. */
export const BotaoCompartilharProduto: React.FC<{ produto: Produto; className?: string }> = ({ produto, className = '' }) => {
  const { home } = useCardapio();
  const nome = home.loja.nome || 'Casa dos Fundos';
  const preco = formatarPreco(melhorPreco(produto, 1, false).total);
  return (
    <button
      type="button"
      onClick={() =>
        compartilhar({
          titulo: produto.nome,
          texto: `${produto.nome} por ${preco} na ${nome}. Peça pelo cardápio:`,
          url: `${window.location.origin}/produto/${produto.id}`,
        })
      }
      aria-label={`Compartilhar ${produto.nome}`}
      className={`w-11 h-11 rounded-full flex items-center justify-center ${className}`}
    >
      <Share2 className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};

/** Link para o Instagram da loja com o @ visível. */
export const LinkInstagram: React.FC<{ className?: string }> = ({ className = '' }) => (
  <a href={URL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 ${className}`}>
    <Instagram className="w-4 h-4" aria-hidden="true" /> @{INSTAGRAM}
  </a>
);

/** Card da confirmação: mandar o cardápio para a galera e postar o brinde marcando a loja. */
export const ConviteDivulgar: React.FC = () => {
  const compartilharCardapio = useCompartilharCardapio();
  return (
    <section className="bg-white rounded-xl p-4 mt-5 text-left shadow-cartao" aria-labelledby="titulo-divulgar">
      <h2 id="titulo-divulgar" className="text-[15px] font-bold">
        Gostou? Chame a galera
      </h2>
      <p className="text-[13px] text-suave mt-1">Mande o cardápio para quem também quer bebida gelada em casa.</p>
      <button
        type="button"
        onClick={compartilharCardapio}
        className="mt-3 w-full h-12 rounded-xl border-2 border-tinta text-tinta text-[15px] font-bold flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" /> Compartilhar cardápio
      </button>
      <a
        href={URL_INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 rounded-xl bg-bloco px-3 py-2.5 text-[13px] leading-snug"
      >
        <Instagram className="w-6 h-6 shrink-0" aria-hidden="true" />
        <span>
          Na hora do brinde, poste nos stories e marque <strong>@{INSTAGRAM}</strong>
        </span>
      </a>
    </section>
  );
};
