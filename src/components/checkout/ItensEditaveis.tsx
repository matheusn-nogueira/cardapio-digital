'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { LinhaCarrinho } from '@/lib/carrinho';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { totalDaLinha } from '@/lib/precoQuantidade';
import { ResumoCombinacao } from '@/components/loja/ProdutoDetalhe';
import { complementoDaLinha } from './OrderSummary';

/**
 * Itens do pedido na última etapa, com "−" e "+" (26/10/2026): dá para acertar a quantidade
 * (arredondar o valor, fechar uma promoção) sem voltar à sacola. Vem aberto com até 3 itens.
 * Como na sacola, no 1 o "−" vira lixeira; tirar mostra "Desfazer" por alguns segundos (um
 * toque sem querer não perde o item). O único item do pedido não sai: o "−" para no 1.
 */
const DESFAZER_POR_MS = 6000;

export const ItensEditaveis: React.FC<{ cartao: boolean; aoMudar?: () => void }> = ({ cartao, aoMudar }) => {
  const { linhas, alterar: alterarSacola, remover, adicionar, adicionarVariante } = useCart();
  const [removido, setRemovido] = useState<LinhaCarrinho | null>(null);

  // o "Desfazer" some sozinho depois de alguns segundos
  useEffect(() => {
    if (!removido) return;
    const relogio = window.setTimeout(() => setRemovido(null), DESFAZER_POR_MS);
    return () => window.clearTimeout(relogio);
  }, [removido]);

  // qualquer mudança invalida um "os valores mudaram" que o banco tenha devolvido antes
  const alterar = (chave: string, n: number) => {
    alterarSacola(chave, n);
    aoMudar?.();
  };
  const tirar = (l: LinhaCarrinho) => {
    remover(l.chave);
    setRemovido(l);
    aoMudar?.();
  };
  const desfazer = () => {
    if (!removido) return;
    if (removido.variante) adicionarVariante(removido.produto.id, removido.variante.id, removido.quantidade);
    else adicionar(removido.produto.id, removido.quantidade);
    setRemovido(null);
    aoMudar?.();
  };
  const unicoItem = linhas.length <= 1;

  // linha compacta, como a sacola do iFood: nome e preço à esquerda, "− 3 +" à direita.
  // O cartão em volta é da tela (um só, com o cabeçalho "Itens").
  return (
    <ul className="divide-y divide-[#F0F0F0]">
      {removido && (
        <li className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-bloco" role="status">
          <span className="text-[14px] min-w-0 truncate">{removido.produto.nome} removido</span>
          <button type="button" onClick={desfazer} className="text-[14px] font-bold underline shrink-0 py-1">
            Desfazer
          </button>
        </li>
      )}
      {linhas.map((l) => {
        // versão escolhida (vasilhame…) explica o preço aqui; promoção quem explica é o ResumoCombinacao
        const complemento = l.variante ? complementoDaLinha(l, cartao) : null;
        const tiraNoMenos = l.quantidade <= 1 && !unicoItem;
        return (
          <li key={l.chave} className="px-3.5 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-snug line-clamp-2">{l.produto.nome}</p>
                <p className="text-[13px] text-suave tabular-nums">
                  <span className="font-bold text-tinta">{formatarPreco(totalDaLinha(l, cartao))}</span>
                  {complemento ? ` · ${complemento}` : ''}
                </p>
              </div>
              <div className="flex items-center shrink-0 h-10 rounded-full border border-borda">
                <button
                  type="button"
                  onClick={() => (l.quantidade <= 1 ? tirar(l) : alterar(l.chave, l.quantidade - 1))}
                  disabled={l.quantidade <= 1 && unicoItem}
                  aria-label={tiraNoMenos ? `Tirar ${l.produto.nome} do pedido` : `Diminuir ${l.produto.nome}`}
                  className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
                >
                  {tiraNoMenos ? <Trash2 className="w-4 h-4 text-desconto" aria-hidden="true" /> : <Minus className="w-4 h-4" aria-hidden="true" />}
                </button>
                <span className="min-w-6 text-center text-[15px] font-bold tabular-nums" aria-live="polite">
                  {l.quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => alterar(l.chave, l.quantidade + 1)}
                  aria-label={`Aumentar ${l.produto.nome}`}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {!l.variante && (
              <ResumoCombinacao produto={l.produto} unidades={l.quantidade} cartao={cartao} aoSomar={(n) => alterar(l.chave, l.quantidade + n)} className="mt-1.5" />
            )}
          </li>
        );
      })}
    </ul>
  );
};
