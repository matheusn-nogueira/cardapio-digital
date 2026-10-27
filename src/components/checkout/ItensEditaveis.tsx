'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { totalDaLinha } from '@/lib/precoQuantidade';
import { ResumoCombinacao } from '@/components/loja/ProdutoDetalhe';
import { complementoDaLinha } from './OrderSummary';

/**
 * Itens do pedido na última etapa, com "−" e "+" (26/10/2026): dá para acertar a quantidade
 * (arredondar o valor, fechar uma promoção) sem voltar à sacola. Fica dentro do bloco
 * recolhido "N itens · Ver", então não pesa a tela para quem não mexe.
 */
export const ItensEditaveis: React.FC<{ cartao: boolean; aoMudar?: () => void }> = ({ cartao, aoMudar }) => {
  const { linhas, alterar: alterarSacola, remover: removerSacola } = useCart();
  // qualquer mudança invalida um "os valores mudaram" que o banco tenha devolvido antes
  const alterar = (chave: string, n: number) => {
    alterarSacola(chave, n);
    aoMudar?.();
  };
  const remover = (chave: string) => {
    removerSacola(chave);
    aoMudar?.();
  };
  return (
    <ul className="bg-white rounded-xl shadow-cartao divide-y divide-[#F0F0F0]">
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
                onClick={() => (l.quantidade <= 1 ? remover(l.chave) : alterar(l.chave, l.quantidade - 1))}
                aria-label={l.quantidade <= 1 ? `Tirar ${l.produto.nome} do pedido` : `Diminuir ${l.produto.nome}`}
                className="w-9 h-9 rounded-full bg-bloco flex items-center justify-center"
              >
                {l.quantidade <= 1 ? (
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
