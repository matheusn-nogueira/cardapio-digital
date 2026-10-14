'use client';

import React from 'react';
import { Bike, Clock } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { formatarPreco } from '@/lib/formatacao';

/** Bloco da home: aberto/fechado, horário de hoje, tempo de entrega e regras do pedido. */
export const StatusLojaCard: React.FC = () => {
  const { home, status } = useCardapio();
  const { config } = home;

  return (
    <section aria-label="Funcionamento" className="px-4 pt-3">
      <div className={`rounded-2xl p-4 shadow-sm ${status.aberta ? 'bg-white' : 'bg-[#FFF1F1] border border-[#F5C2C2]'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${status.aberta ? 'bg-sucesso' : 'bg-perigo'}`}
            aria-hidden="true"
          />
          <h2 className={`text-[15px] font-bold ${status.aberta ? 'text-sucesso' : 'text-perigo'}`}>{status.titulo}</h2>
          {status.detalhe && <span className="text-[13px] text-suave">· {status.detalhe}</span>}
        </div>

        {!status.aberta && <p className="text-[14px] text-tinta mt-1.5">{config.mensagem_fechado}</p>}

        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-suave">
          <li className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" aria-hidden="true" /> {status.horarioHoje}
          </li>
          <li className="flex items-center gap-1.5">
            <Bike className="w-4 h-4" aria-hidden="true" /> Entrega em {config.tempo_entrega_min}–{config.tempo_entrega_max} min
          </li>
          {config.pedido_minimo > 0 && <li>Pedido mínimo {formatarPreco(config.pedido_minimo)}</li>}
          {config.frete_gratis_acima != null && config.frete_gratis_acima > 0 && (
            <li className="text-sucesso font-medium">Frete grátis acima de {formatarPreco(config.frete_gratis_acima)}</li>
          )}
        </ul>
      </div>
    </section>
  );
};
