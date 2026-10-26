'use client';

import React, { useEffect, useRef } from 'react';
import { Banknote, Clock, MapPin, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { horarioResumido } from '@/lib/horarios';
import { linkWhatsapp, mascararTelefone } from '@/lib/formatacao';
import { LogoElo, LogoMastercard, LogoPix, LogoVisa, LogoWhatsApp } from '@/components/checkout/LogosPagamento';

/**
 * "Sobre a loja", como no iFood e no Zé: horário, bairro, formas de pagamento e WhatsApp numa
 * folha que abre ao tocar no nome da loja no topo. Substitui o rodapé de site (26/10/2026): app
 * não tem rodapé, o fim da lista é só o fim da lista.
 */
export const SobreLoja: React.FC<{ aberta: boolean; aoFechar: () => void }> = ({ aberta, aoFechar }) => {
  const { home } = useCardapio();
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const { loja, config, horarios } = home;
  const telefone = config.whatsapp || loja.telefone;
  const whatsapp = linkWhatsapp(telefone);
  const local = [loja.bairro, loja.cidade].filter(Boolean).join(', ');
  const semana = horarioResumido(horarios);

  useEffect(() => {
    if (!aberta) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
      anterior?.focus?.();
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={aoFechar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-sobre-loja"
        className="relative w-full sm:max-w-[440px] max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl animate-sobe pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 bg-white flex justify-end px-3 pt-3">
          <button
            ref={botaoFechar}
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="w-11 h-11 rounded-full bg-bloco flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      <div className="px-5 pt-2 pb-6 space-y-5">
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
            <h2 id="titulo-sobre-loja" className="text-[18px] font-bold leading-tight">{loja.nome}</h2>
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
      </div>
    </div>
  );
};
