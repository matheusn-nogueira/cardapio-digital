'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Banknote, Clock, MapPin } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { horarioResumido } from '@/lib/horarios';
import { linkWhatsapp, mascararTelefone } from '@/lib/formatacao';
import { ehEtapaDoCheckout, ehRotaDeCompra } from '@/lib/rotas';
import { LogoElo, LogoMastercard, LogoPix, LogoVisa, LogoWhatsApp } from '@/components/checkout/LogosPagamento';

/**
 * Rodapé claro e enxuto (26/10/2026; o escuro, com a semana inteira de horários e um botão de
 * WhatsApp repetido, pesava no fim da página): loja e bairro, horário resumido, formas de
 * pagamento com os logos reais, WhatsApp como link discreto (a aba já existe) e o aviso legal.
 */
export const Footer: React.FC = () => {
  const { home } = useCardapio();
  const pathname = usePathname();
  const { quantidadeTotal } = useCart();
  const hidratado = useHidratado();
  const { loja, config, horarios } = home;
  const telefone = config.whatsapp || loja.telefone;
  const whatsapp = linkWhatsapp(telefone);
  const local = [loja.bairro, loja.cidade].filter(Boolean).join(', ');
  const semana = horarioResumido(horarios);

  // nas etapas do checkout o rodapé some (nada que tire o foco do pedido)
  if (ehEtapaDoCheckout(pathname)) return null;
  // espaço para as barras fixas de baixo: só as abas (64 px) ou abas + "Ver sacola"
  const espacoSacola = ehRotaDeCompra(pathname) ? 'pb-8' : hidratado && quantidadeTotal > 0 ? 'pb-40' : 'pb-24';

  return (
    <footer className={`bg-white border-t border-[#EFEFEF] text-tinta ${espacoSacola}`}>
      <div className="max-w-[560px] mx-auto px-4 pt-7 space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-primaria flex items-center justify-center overflow-hidden shrink-0">
            {loja.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={loja.logo_url} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <span className="font-black text-primaria-texto">{loja.nome.charAt(0)}</span>
            )}
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold leading-tight">{loja.nome}</h2>
            {local && (
              <p className="text-[13px] text-suave flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {local}
              </p>
            )}
          </div>
        </div>

        {semana.length > 0 && (
          <div>
            <h3 className="text-[13px] font-bold text-suave mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" /> Horário
            </h3>
            <dl className="text-[14px] space-y-0.5">
              {semana.map((g) => (
                <div key={g.dias} className="flex justify-between gap-3">
                  <dt>{g.dias}</dt>
                  <dd className="font-medium tabular-nums">{g.faixa}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div>
          <h3 className="text-[13px] font-bold text-suave mb-2">Formas de pagamento</h3>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
            {config.aceita_pix && (
              <li className="flex items-center gap-1.5">
                <LogoPix className="w-5 h-5" /> Pix
              </li>
            )}
            {config.aceita_dinheiro && (
              <li className="flex items-center gap-1.5">
                <Banknote className="w-5 h-5 text-sucesso" strokeWidth={1.75} aria-hidden="true" /> Dinheiro
              </li>
            )}
            {config.aceita_cartao_entrega && (
              <li className="flex items-center gap-1.5">
                <span className="sr-only">Cartão na entrega: </span>
                <LogoVisa className="h-3.5 w-auto" />
                <LogoMastercard className="h-4 w-auto" />
                <LogoElo className="h-3.5 w-auto" />
                <span aria-hidden="true">na entrega</span>
              </li>
            )}
          </ul>
        </div>

        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-bold underline">
            <LogoWhatsApp className="w-4 h-4" /> {mascararTelefone(telefone ?? '')}
          </a>
        )}

        <p className="flex items-center gap-2.5 pt-4 border-t border-[#EFEFEF] text-[12px] text-suave leading-snug">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-borda text-[10px] font-black text-tinta shrink-0"
            aria-hidden="true"
          >
            18+
          </span>
          Venda e consumo de bebida alcoólica proibidos para menores de 18 anos. Beba com moderação.
        </p>
      </div>
    </footer>
  );
};
