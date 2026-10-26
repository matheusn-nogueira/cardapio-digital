'use client';

import Image from 'next/image';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { ehRotaDeCompra } from '@/lib/rotas';
import { Badge } from '@/components/ui/Badge';


const CampoBusca: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const naBusca = pathname === '/busca';
  const termoUrl = naBusca ? params.get('q') ?? '' : '';
  const [texto, setTexto] = useState(termoUrl);
  const [rotaAnterior, setRotaAnterior] = useState(pathname);

  // Saiu da busca → limpa o campo (ajuste de estado durante o render, sem effect).
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setTexto(termoUrl);
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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] w-5 h-5 pointer-events-none" aria-hidden="true" />
      <input
        id="campo-busca"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => buscar(e.target.value)}
        autoFocus={naBusca && !termoUrl}
        className="w-full h-12 pr-11 pl-12 rounded-xl bg-bloco text-[16px] text-tinta outline-none placeholder:text-[14px] placeholder:text-[#9B9B9B] [&::-webkit-search-cancel-button]:hidden"
        placeholder="Busque por bebida ou marca"
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

/** Topo claro como o app do Zé: logo, nome e status no meio, sacola à direita. A busca fica só na aba Busca. */
export const Header: React.FC = () => {
  const { home, status } = useCardapio();
  const { quantidadeTotal, abrirSacola } = useCart();
  const hidratado = useHidratado();
  const pathname = usePathname();
  const { loja, config } = home;
  const naBusca = pathname === '/busca';

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
      <header className="bg-white text-tinta px-4 sticky top-0 z-40 border-b border-[#EFEFEF]">
        <div className="h-16 flex items-center gap-3 max-w-[1100px] mx-auto">
          <Link href="/" className="w-11 h-11 rounded-full bg-primaria flex items-center justify-center overflow-hidden shrink-0 font-black text-primaria-texto" aria-label={`${loja.nome} — início`}>
            {loja.logo_url ? (
              <Image src={loja.logo_url} alt="" width={96} height={96} priority className="w-10 h-10 object-contain" />
            ) : (
              loja.nome.charAt(0)
            )}
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <span className="block text-[17px] font-bold leading-tight truncate">{loja.nome}</span>
            <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium leading-tight mt-0.5 ${status.aberta ? 'text-sucesso' : 'text-perigo'}`}>
              <span className={`w-2 h-2 rounded-full ${status.aberta ? 'bg-sucesso' : 'bg-perigo'}`} aria-hidden="true" />
              <span className="truncate">
                {status.aberta ? 'Aberto' : 'Fechado'}
                {status.fechaEm ?? status.detalhe ? ` · ${status.fechaEm ?? status.detalhe}` : ''}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={abrirSacola}
            className="relative w-11 h-11 rounded-full bg-bloco flex items-center justify-center shrink-0 text-tinta"
            aria-label={`Abrir sacola${hidratado && quantidadeTotal ? ` (${quantidadeTotal} itens)` : ''}`}
          >
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {hidratado && <Badge count={quantidadeTotal} />}
          </button>
        </div>
        {naBusca && (
          <div className="max-w-[1100px] mx-auto pb-3">
            <Suspense fallback={<div className="h-12 rounded-xl bg-bloco" />}>
              <CampoBusca />
            </Suspense>
          </div>
        )}
      </header>
    </>
  );
};
