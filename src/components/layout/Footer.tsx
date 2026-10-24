'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MapPin, MessageCircle } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { faixaHorario, NOMES_DIAS } from '@/lib/horarios';
import { linkWhatsapp, mascararTelefone } from '@/lib/formatacao';

export const Footer: React.FC = () => {
  const { home } = useCardapio();
  const pathname = usePathname();
  const { loja, config, horarios } = home;
  const whatsapp = linkWhatsapp(config.whatsapp || loja.telefone);
  const local = [loja.bairro, loja.cidade].filter(Boolean).join(', ');
  const pagamentos = [
    config.aceita_pix && 'Pix',
    config.aceita_dinheiro && 'Dinheiro',
    config.aceita_cartao_entrega && 'Cartão na entrega (crédito/débito)',
  ].filter(Boolean);

  // Espaço para a barra fixa da sacola nas páginas de compra
  const espacoSacola = ['/checkout', '/payment', '/confirmation'].includes(pathname) ? '' : 'pb-28';

  return (
    <footer className={`bg-topo text-white ${espacoSacola}`}>
      <div className="max-w-[1100px] mx-auto px-4 py-8 grid gap-7 sm:grid-cols-3">
        <div>
          <h2 className="text-[17px] font-black">{loja.nome}</h2>
          <p className="text-[13px] text-white/75 mt-1">{config.slogan}</p>
          {local && (
            <p className="text-[13px] text-white/75 mt-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" /> {local}
            </p>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 py-2.5 px-4 rounded-full bg-[#1F9D55] text-white text-[14px] font-bold"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              WhatsApp {mascararTelefone(config.whatsapp || loja.telefone || '')}
            </a>
          )}
        </div>

        {horarios.length > 0 && (
          <div>
            <h3 className="text-[14px] font-bold mb-2">Horário de funcionamento</h3>
            <dl className="text-[13px] text-white/80 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {horarios.map((h) => (
                <React.Fragment key={h.dia_semana}>
                  <dt className="capitalize">{NOMES_DIAS[h.dia_semana]}</dt>
                  <dd>{faixaHorario(h)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}

        {pagamentos.length > 0 && (
          <div>
            <h3 className="text-[14px] font-bold mb-2">Formas de pagamento</h3>
            <ul className="text-[13px] text-white/80 space-y-1">
              {pagamentos.map((p) => (
                <li key={String(p)}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-white/15 py-4 px-4 text-center text-[12px] text-white/70">
        🔞 Beba com moderação. Venda de bebidas alcoólicas proibida para menores de 18 anos.
      </div>
    </footer>
  );
};
