'use client';

import React from 'react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem } from '@/lib/armazenamento';
import { montarLinhas } from '@/lib/carrinho';
import { armazemPedidoAnterior } from '@/lib/estado-checkout';
import { formatarPreco } from '@/lib/formatacao';
import { subtotalCarrinho } from '@/lib/precoQuantidade';
import { ImagemProduto } from './ImagemProduto';

const FOTOS_VISIVEIS = 2;

function quando(feitoEm: number): string {
  const dia = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
  if (dia(feitoEm) === dia(Date.now())) return 'de hoje';
  if (dia(feitoEm) === dia(Date.now() - 86_400_000)) return 'de ontem';
  return `de ${dia(feitoEm)}`;
}

/**
 * "Peça de novo" (27/10/2026): quem já pediu neste aparelho vê o último pedido no topo da
 * home e põe tudo na sacola com um toque (adega: a pessoa costuma levar a mesma coisa).
 * Preço e disponibilidade são os de agora; item que saiu do cardápio fica de fora.
 * Some quando a sacola já tem alguma coisa, para não somar em dobro.
 */
export const PecaDeNovo: React.FC = () => {
  const [anterior] = useArmazem(armazemPedidoAnterior);
  const { produtoPorId } = useCardapio();
  const { linhas: naSacola, adicionar, adicionarVariante, abrirSacola } = useCart();
  if (!anterior || naSacola.length) return null;

  const { linhas } = montarLinhas(anterior.itens, (id) => produtoPorId.get(id));
  if (!linhas.length) return null;

  const quantidade = linhas.length === 1 ? '1 item' : `${linhas.length} itens`;
  const fotos = linhas.slice(0, FOTOS_VISIVEIS);
  const subtotal = formatarPreco(subtotalCarrinho(linhas, false));

  const repetir = () => {
    for (const l of linhas) {
      if (l.variante) adicionarVariante(l.produto.id, l.variante.id, l.quantidade);
      else adicionar(l.produto.id, l.quantidade);
    }
    abrirSacola();
  };

  // Uma linha só (dono, 27/10/2026: o cartão com lista de itens ocupava a tela de cima).
  // Preto com o botão amarelo (dono, 27/10/2026): é o atalho pessoal e o bloco mais forte
  // depois do banner; o creme parecia aviso.
  // A linha inteira é o botão; a sacola abre em seguida mostrando o que entrou.
  return (
    <section aria-label="Peça de novo" className="px-4 pt-4">
      <button
        type="button"
        onClick={repetir}
        aria-label={`Peça de novo: pôr na sacola os ${quantidade} do seu pedido ${quando(anterior.feitoEm)}, ${subtotal}`}
        className="w-full flex items-center gap-3 rounded-2xl bg-tinta px-4 py-3 text-left active:opacity-90 transition-opacity"
      >
        <span className="flex shrink-0 pl-3" aria-hidden="true">
          {fotos.map((l) => (
            <span key={l.chave} className="relative -ml-3 w-10 h-10 rounded-lg bg-white border-2 border-tinta p-0.5">
              <ImagemProduto produto={l.produto} tamanho="pequena" />
            </span>
          ))}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-condensed text-[19px] font-extrabold uppercase text-white leading-none whitespace-nowrap">Peça de novo</span>
          <span className="block text-[13px] text-white/70 truncate mt-0.5">
            {quando(anterior.feitoEm).replace(/^de /, '')} · {quantidade}
          </span>
        </span>
        <span className="shrink-0 h-10 px-4 rounded-xl bg-primaria text-primaria-texto text-[14px] font-bold flex items-center" aria-hidden="true">
          Adicionar
        </span>
      </button>
    </section>
  );
};
