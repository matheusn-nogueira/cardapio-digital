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

  return (
    <ul className="bg-white rounded-xl shadow-cartao divide-y divide-[#F0F0F0]">
      {removido && (
        <li className="p-3.5 flex items-center justify-between gap-3 bg-bloco" role="status">
          <span className="text-[14px] min-w-0 truncate">{removido.produto.nome} removido</span>
          <button type="button" onClick={desfazer} className="text-[14px] font-bold underline shrink-0 py-1">
            Desfazer
          </button>
        </li>
      )}
      {linhas.map((l) => {
        const complemento = complementoDaLinha(l, cartao);
        return (
          <li key={l.chave} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] leading-snug">{l.produto.nome}</p>
                {complemento && <p className="text-[12px] text-suave">{complemento}</p>}
              </div>
              <span className="text-[15px] font-bold tabular-nums shrink-0">{formatarPreco(totalDaLinha(l, cartao))}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={() => (l.quantidade <= 1 ? tirar(l) : alterar(l.chave, l.quantidade - 1))}
                disabled={l.quantidade <= 1 && unicoItem}
                aria-label={l.quantidade <= 1 && !unicoItem ? `Tirar ${l.produto.nome} do pedido` : `Diminuir ${l.produto.nome}`}
                className="w-9 h-9 rounded-full bg-bloco flex items-center justify-center disabled:opacity-35"
              >
                {l.quantidade <= 1 && !unicoItem ? (
                  <Trash2 className="w-4 h-4 text-desconto" aria-hidden="true" />
                ) : (
                  <Minus className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
              <span className="min-w-8 text-center text-[15px] font-bold tabular-nums" aria-live="polite">
                {l.quantidade}
              </span>
              <button
                type="button"
                onClick={() => alterar(l.chave, l.quantidade + 1)}
                aria-label={`Aumentar ${l.produto.nome}`}
                className="w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            {!l.variante && (
              <ResumoCombinacao produto={l.produto} unidades={l.quantidade} aoSomar={(n) => alterar(l.chave, l.quantidade + n)} className="mt-2" />
            )}
          </li>
        );
      })}
    </ul>
  );
};
