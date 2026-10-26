'use client';

import React from 'react';
import { Bike, Clock, ShoppingBag, Truck } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { formatarPreco } from '@/lib/formatacao';

interface Fato {
  icone: React.ReactNode;
  valor: string;
  rotulo: string;
}

const COLUNAS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

/**
 * Linha de fatos da loja, logo abaixo do topo: tempo de entrega, frete mais barato,
 * horário de hoje e pedido mínimo. Tira as dúvidas antes do primeiro toque.
 * Com a loja fechada, vira um aviso em destaque com os mesmos fatos embaixo.
 */
export const StatusLojaCard: React.FC = () => {
  const { home, status } = useCardapio();
  const { config } = home;

  const fatos: Fato[] = [
    {
      icone: <Bike className="w-4 h-4" aria-hidden="true" />,
      valor: `${config.tempo_entrega_min}–${config.tempo_entrega_max} min`,
      rotulo: 'tempo',
    },
  ];
  if (home.frete_minimo != null && home.frete_minimo > 0) {
    fatos.push({ icone: <Truck className="w-4 h-4" aria-hidden="true" />, valor: `desde ${formatarPreco(home.frete_minimo)}`, rotulo: 'entrega' });
  }
  fatos.push({
    icone: <Clock className="w-4 h-4" aria-hidden="true" />,
    valor: status.horarioHoje.replace('Hoje: ', '').replace(' às ', '–'),
    rotulo: 'hoje',
  });
  if (config.pedido_minimo > 0) {
    fatos.push({ icone: <ShoppingBag className="w-4 h-4" aria-hidden="true" />, valor: formatarPreco(config.pedido_minimo), rotulo: 'pedido mínimo' });
  }

  return (
    <section aria-label="Funcionamento" className="px-4 pt-4">
      {!status.aberta && (
        <div className="rounded-lg px-3.5 py-3 mb-2 bg-[#FFF1F1] border border-[#F5C2C2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-perigo" aria-hidden="true" />
            <h2 className="text-[15px] font-bold text-perigo">{status.titulo}</h2>
            {status.detalhe && <span className="text-[13px] text-suave">· {status.detalhe}</span>}
          </div>
          <p className="text-[14px] text-tinta mt-1.5">{config.mensagem_fechado}</p>
        </div>
      )}
      {status.aberta && <h2 className="sr-only">{status.titulo}</h2>}

      <dl className={`grid gap-2 ${COLUNAS[fatos.length] ?? 'grid-cols-3'}`}>
        {fatos.map((f) => (
          <div key={f.rotulo} className="rounded-xl border border-[#EFEFEF] px-2 py-2.5 flex flex-col items-center text-center">
            <dt className="flex items-center gap-1 text-[10.5px] uppercase tracking-wide text-rotulo">
              {f.icone}
              <span>{f.rotulo}</span>
            </dt>
            <dd className="text-[13.5px] font-bold text-tinta leading-tight mt-1 tabular-nums">{f.valor}</dd>
          </div>
        ))}
      </dl>

      {config.frete_gratis_acima != null && config.frete_gratis_acima > 0 && (
        <p className="mt-2 text-[12.5px] font-bold text-sucesso text-center">
          Frete grátis acima de {formatarPreco(config.frete_gratis_acima)}
        </p>
      )}
    </section>
  );
};
