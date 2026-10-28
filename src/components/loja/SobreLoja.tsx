'use client';

import React, { useEffect, useRef } from 'react';
import { Banknote, Clock, MapPin, Navigation, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { horarioResumido } from '@/lib/horarios';
import { tilesDoMapa } from '@/lib/mapa';
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
  // mapa com as imagens do OpenStreetMap (lib/mapa) e rota no Google Maps, que abre o app de mapas do celular
  const ponto = loja.latitude != null && loja.longitude != null ? { lat: loja.latitude, lng: loja.longitude } : null;
  const destino = ponto ? `${ponto.lat},${ponto.lng}` : [loja.endereco, local].filter(Boolean).join(', ');
  const rota = destino ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}` : null;

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
      <div className="absolute inset-0 bg-tinta/45 backdrop-blur-[3px] animate-fade-in" onClick={aoFechar} aria-hidden="true" />
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
            {config.slogan && <p className="text-[13px] text-suave mt-0.5">{config.slogan}</p>}
          </div>
        </div>

        {(loja.endereco || local) && (
          <div>
            <h3 className="text-[13px] font-bold text-suave mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" aria-hidden="true" /> Endereço
            </h3>
            <p className="text-[14px]">
              {loja.endereco && <span className="font-medium">{loja.endereco}</span>}
              {loja.endereco && local ? ' · ' : ''}
              {local}
            </p>
            {ponto && (
              // o mapa é só a figura (sem arrastar dentro da folha): o toque abre a rota no app de mapas
              <a
                href={rota!}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block mt-2.5 h-40 rounded-2xl overflow-hidden border border-borda bg-mapa"
                aria-label="Ver a rota até a loja no mapa"
              >
                {/* tiles montados para 440 px de largura, com o ponto no centro: cabe em qualquer largura menor */}
                {tilesDoMapa(ponto.lat, ponto.lng, 16, 440, 160).map((t) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={t.url}
                    src={t.url}
                    alt=""
                    width={256}
                    height={256}
                    className="absolute max-w-none"
                    style={{ left: `calc(50% + ${t.esquerda - 220}px)`, top: t.topo }}
                  />
                ))}
                <MapPin
                  className="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-full text-perigo fill-white drop-shadow"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="absolute right-1.5 bottom-1 text-[10px] text-tinta/70 bg-white/80 px-1 rounded">© OpenStreetMap</span>
              </a>
            )}
            {rota && (
              <a
                href={rota}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 w-full h-12 rounded-xl border-2 border-tinta flex items-center justify-center gap-2 text-[15px] font-bold"
              >
                <Navigation className="w-4 h-4" aria-hidden="true" /> Como chegar
              </a>
            )}
          </div>
        )}

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
                <Banknote className="w-5 h-5 text-tinta" strokeWidth={1.75} aria-hidden="true" /> Dinheiro
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
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-bold link-acao">
            <LogoWhatsApp className="w-4 h-4" /> {mascararTelefone(telefone ?? '')}
          </a>
        )}

        <p className="flex items-center gap-2.5 pt-4 border-t border-borda text-[12px] text-suave leading-snug">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-borda text-[12px] font-black text-tinta shrink-0"
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
