'use client';

import Image from 'next/image';
import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { ehRotaDeCompra } from '@/lib/rotas';
import { SobreLoja } from '@/components/loja/SobreLoja';


const CampoBusca: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const naBusca = pathname === '/busca';
  const termoUrl = naBusca ? params.get('q') ?? '' : '';
  const [texto, setTexto] = useState(termoUrl);
  const [rotaAnterior, setRotaAnterior] = useState(pathname);
  const [termoAnterior, setTermoAnterior] = useState(termoUrl);

  // Saiu da busca → limpa o campo (ajuste de estado durante o render, sem effect).
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setTermoAnterior(termoUrl);
    setTexto(termoUrl);
  } else if (termoAnterior !== termoUrl) {
    setTermoAnterior(termoUrl);
    // aba Busca tocada com resultados abertos: /busca sem termo mostra as categorias, e o campo
    // não pode ficar com o termo velho ("gelo"). Os outros saltos de termo vêm da própria digitação.
    if (!termoUrl) setTexto('');
  }

  const buscar = (valor: string) => {
    setTexto(valor);
    const destino = `/busca?q=${encodeURIComponent(valor)}`;
    if (naBusca) router.replace(destino, { scroll: false });
    else if (valor.trim()) router.push(destino);
  };

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/busca?q=${encodeURIComponent(texto)}`);
      }}
    >
      <label htmlFor="campo-busca" className="sr-only">
        Buscar produtos
      </label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-apagado w-5 h-5 pointer-events-none" aria-hidden="true" />
      <input
        id="campo-busca"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => buscar(e.target.value)}
        autoFocus={naBusca && !termoUrl}
        className="w-full h-12 pr-11 pl-12 rounded-xl bg-white text-[16px] text-tinta outline-none placeholder:text-[14px] placeholder:text-apagado [&::-webkit-search-cancel-button]:hidden"
        placeholder="Buscar cerveja, gelo, carvão"
      />
      {texto && (
        <button
          type="button"
          onClick={() => buscar('')}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-suave"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
};

/**
 * Topo azul-noite (Freezer, 27/10/2026): logo, nome e status à esquerda e a busca sempre à mão logo
 * abaixo, como no protótipo aprovado pelo dono. A sacola fica na barra de baixo e no botão flutuante.
 */
export const Header: React.FC = () => {
  const { home, status } = useCardapio();
  const pathname = usePathname();
  const { loja, config } = home;
  const [sobreAberto, setSobreAberto] = useState(false);
  // função estável: a folha não reabre o foco a cada atualização do topo ("Fecha em…")
  const fecharSobre = useCallback(() => setSobreAberto(false), []);

  if (ehRotaDeCompra(pathname)) {
    return config.aviso_topo ? (
      <div className="bg-tinta text-white text-[13px] text-center px-4 py-2">{config.aviso_topo}</div>
    ) : null;
  }

  return (
    <>
      {config.aviso_topo && (
        <div className="bg-tinta text-white text-[13px] font-medium text-center px-4 py-2">{config.aviso_topo}</div>
      )}
      <header className="bg-topo text-white px-4 sticky top-0 z-40">
        <div className="pt-3 pb-3 flex items-center gap-2.5 max-w-[1100px] mx-auto">
          {/* o logo já tem a forma da casa: sem círculo atrás (o amarelo do círculo, diferente
              do amarelo do logo, aparecia como um contorno laranja; dono, 27/10/2026) */}
          <Link href="/" className="w-12 h-12 -ml-1.5 flex items-center justify-center shrink-0" aria-label={`${loja.nome} — início`}>
            {loja.logo_url ? (
              <Image src={loja.logo_url} alt="" width={96} height={96} priority className="w-12 h-12 object-contain" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-primaria text-primaria-texto font-black flex items-center justify-center">{loja.nome.charAt(0)}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSobreAberto(true)}
            className="min-w-0 flex-1 text-left"
            aria-label={`${loja.nome}: ver horário, endereço e formas de pagamento`}
          >
            <span className="flex items-center gap-1 font-condensed text-[20px] font-bold uppercase tracking-[0.03em] leading-none">
              <span className="truncate">{loja.nome}</span>
              <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium leading-tight mt-1 ${status.aberta ? 'text-topo-texto' : 'text-[#FFC98A]'}`}>
              <span className={`w-2 h-2 rounded-full ${status.aberta ? 'bg-[#4ADE80]' : 'bg-[#FFC98A]'}`} aria-hidden="true" />
              <span className="truncate">
                {status.aberta ? 'Aberto' : 'Fechado'}
                {status.fechaEm ?? status.detalhe ? ` · ${status.fechaEm ?? status.detalhe}` : ''}
              </span>
            </span>
          </button>
        </div>
        <div className="max-w-[1100px] mx-auto pb-3">
          <Suspense fallback={<div className="h-12 rounded-xl bg-white" />}>
            <CampoBusca />
          </Suspense>
        </div>
      </header>
      <SobreLoja aberta={sobreAberto} aoFechar={fecharSobre} />
    </>
  );
};
