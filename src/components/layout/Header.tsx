'use client';

import Image from 'next/image';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useHidratado } from '@/lib/armazenamento';
import { Badge } from '@/components/ui/Badge';

const ROTAS_CHECKOUT = ['/checkout', '/payment', '/confirmation'];

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
        className="w-full h-12 pr-11 pl-12 rounded-lg bg-white text-[16px] text-tinta outline-none placeholder:text-[14px] placeholder:text-[#9B9B9B] [&::-webkit-search-cancel-button]:hidden"
        placeholder="Pesquise sua bebida favorita"
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

export const Header: React.FC = () => {
  const { home, status } = useCardapio();
  const { quantidadeTotal, abrirSacola } = useCart();
  const hidratado = useHidratado();
  const pathname = usePathname();
  const { loja, config } = home;

  if (ROTAS_CHECKOUT.includes(pathname)) {
    return config.aviso_topo ? (
      <div className="bg-tinta text-white text-[13px] text-center px-4 py-2">{config.aviso_topo}</div>
    ) : null;
  }

  return (
    <>
      {config.aviso_topo && (
        <div className="bg-tinta text-white text-[13px] font-medium text-center px-4 py-2">{config.aviso_topo}</div>
      )}
      <header className="bg-topo text-white pt-4 pb-4 px-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 mb-4 max-w-[1100px] mx-auto">
          <Link href="/" className="flex items-center gap-3 min-w-0 flex-1" aria-label={`${loja.nome} — início`}>
            <span className="w-11 h-11 rounded-full bg-primaria flex items-center justify-center overflow-hidden shrink-0 font-black text-primaria-texto" aria-hidden="true">
              {loja.logo_url ? (
                <Image src={loja.logo_url} alt="" width={96} height={96} priority className="w-10 h-10 object-contain" />
              ) : (
                loja.nome.charAt(0)
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight truncate">{loja.nome}</span>
              <span className={`flex items-center gap-1 text-[14px] font-bold leading-tight mt-0.5 ${status.aberta ? 'text-primaria' : 'text-[#FF8A80]'}`}>
                <span className="truncate">
                  {status.aberta ? 'Aberto' : 'Fechado'}
                  {status.detalhe ? ` · ${status.detalhe}` : ''}
                </span>
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={abrirSacola}
            className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white"
            aria-label={`Abrir sacola${hidratado && quantidadeTotal ? ` (${quantidadeTotal} itens)` : ''}`}
          >
            <ShoppingBag className="w-6 h-6" aria-hidden="true" />
            {hidratado && <Badge count={quantidadeTotal} />}
          </button>
        </div>
        <div className="max-w-[1100px] mx-auto">
          <Suspense fallback={<div className="h-12 rounded-lg bg-white" />}>
            <CampoBusca />
          </Suspense>
        </div>
      </header>
    </>
  );
};
