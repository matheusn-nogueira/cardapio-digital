'use client';

import React from 'react';
import { Bike, Clock, ShoppingBag } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { formatarPreco } from '@/lib/formatacao';

interface Fato {
  icone: React.ReactNode;
  valor: string;
  rotulo: string;
}

/**
 * Fatos da loja, logo abaixo do banner: tempo de entrega, área de entrega e pedido mínimo,
 * numa linha só de texto como no iFood (27/10/2026: os quadros com
 * borda, um ao lado do outro, davam cara de formulário). Com a loja fechada, um aviso
 * compacto em laranja vem antes (aviso, não erro).
 */
export const StatusLojaCard: React.FC = () => {
  const { home, status } = useCardapio();
  const { config } = home;
  const icone = (I: typeof Bike) => <I className="w-4 h-4 shrink-0" aria-hidden="true" />;

  // como no protótipo Freezer (dono, 27/10/2026): tempo e área de entrega; a taxa aparece no checkout
  const fatos: Fato[] = [
    { icone: icone(Clock), valor: `${config.tempo_entrega_min}–${config.tempo_entrega_max} min`, rotulo: 'Tempo de entrega' },
    { icone: icone(Bike), valor: `Entrega em ${home.loja.bairro || 'Realengo'} e região`, rotulo: 'Área de entrega' },
  ];
  // horário de hoje fica de fora: aberta, o topo já diz "Fecha em…"; fechada, o aviso acima diz quando abre
  if (config.pedido_minimo > 0) {
    fatos.push({ icone: icone(ShoppingBag), valor: `Mínimo ${formatarPreco(config.pedido_minimo)}`, rotulo: 'Pedido mínimo' });
  }

  return (
    <section aria-label="Funcionamento" className="px-4 pt-4">
      {status.aberta ? (
        <h2 className="sr-only">{status.titulo}</h2>
      ) : (
        <div className="rounded-xl px-3.5 py-2.5 mb-3 bg-aviso-claro">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-aviso">
            <Clock className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            {status.titulo}
            {status.detalhe && <span className="font-medium">· {status.detalhe}</span>}
          </h2>
          <p className="text-[13.5px] text-tinta mt-0.5 pl-[26px]">{config.mensagem_fechado}</p>
        </div>
      )}

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-tinta">
        {fatos.map((f) => (
          <div key={f.rotulo} className="flex items-center gap-1.5">
            <dt className="text-suave">
              {f.icone}
              <span className="sr-only">{f.rotulo}</span>
            </dt>
            <dd className="font-semibold tabular-nums">{f.valor}</dd>
          </div>
        ))}
      </dl>

      {config.frete_gratis_acima != null && config.frete_gratis_acima > 0 && (
        <p className="mt-1.5 text-[13px] font-bold text-sucesso">Entrega grátis acima de {formatarPreco(config.frete_gratis_acima)}</p>
      )}
    </section>
  );
};
