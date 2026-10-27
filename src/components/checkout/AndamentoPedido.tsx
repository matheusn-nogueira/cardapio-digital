'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { buscarStatusPedido } from '@/lib/api-cliente';
import { etapasDoPedido, pedidoEncerrado, type StatusPedido } from '@/lib/andamento';

const A_CADA_MS = 15_000;

/**
 * Andamento do pedido na confirmação (26/10/2026): consulta o status a cada 15 s com a tela
 * visível (cardapio_status_pedido) e para quando o pedido termina. Sem resposta do banco,
 * mostra a primeira etapa ("Pedido recebido"), que é o que já se sabe.
 */
export const AndamentoPedido: React.FC<{ pedidoId?: string; retirada: boolean; previsao?: string }> = ({ pedidoId, retirada, previsao }) => {
  const [status, setStatus] = useState<StatusPedido | null>(null);

  useEffect(() => {
    if (!pedidoId) return; // pedido guardado antes de existir o id: fica em "Pedido recebido"
    let ativo = true;
    let relogio = 0;
    const consultar = async () => {
      if (document.hidden) return;
      const r = await buscarStatusPedido(pedidoId);
      if (!ativo || !r) return;
      setStatus(r.status);
      if (pedidoEncerrado(r.status)) window.clearInterval(relogio);
    };
    void consultar();
    relogio = window.setInterval(() => void consultar(), A_CADA_MS);
    const aoVoltar = () => void consultar();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      ativo = false;
      window.clearInterval(relogio);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [pedidoId]);

  if (status === 'cancelado') {
    return (
      <section className="bg-white rounded-xl p-4 mt-5 text-left shadow-cartao" aria-live="polite">
        <p className="text-[15px] font-bold text-perigo">Este pedido foi cancelado pela loja.</p>
      </section>
    );
  }

  const etapas = etapasDoPedido(status ?? 'aguardando_preparo', retirada);
  return (
    <section className="bg-white rounded-xl p-4 mt-5 text-left shadow-cartao" aria-labelledby="titulo-andamento" aria-live="polite">
      <h2 id="titulo-andamento" className="text-[15px] font-bold">
        Acompanhe seu pedido
      </h2>
      {previsao && <p className="text-[13px] text-suave mt-0.5">{previsao}</p>}
      <ol className="mt-3">
        {etapas.map((e, i) => (
          <li key={e.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  e.estado === 'feita' ? 'bg-sucesso text-white' : e.estado === 'atual' ? 'bg-tinta text-white' : 'bg-bloco'
                }`}
                aria-hidden="true"
              >
                {e.estado === 'feita' ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : e.estado === 'atual' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primaria-texto animate-pulse" />
                ) : null}
              </span>
              {i < etapas.length - 1 && (
                <span className={`w-0.5 flex-1 min-h-5 ${e.estado === 'feita' ? 'bg-sucesso' : 'bg-bloco'}`} aria-hidden="true" />
              )}
            </div>
            <p
              className={`pb-4 text-[15px] leading-6 ${e.estado === 'falta' ? 'text-suave' : 'font-bold text-tinta'}`}
              aria-current={e.estado === 'atual' ? 'step' : undefined}
            >
              {e.titulo}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};
