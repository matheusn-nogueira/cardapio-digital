'use client';

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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-suave w-5 h-5 pointer-events-none" aria-hidden="true" />
      <input
        id="campo-busca"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => buscar(e.target.value)}
        className="w-full h-12 pr-11 pl-11 rounded-2xl bg-white text-[16px] text-tinta shadow-sm outline-none placeholder:text-suave [&::-webkit-search-cancel-button]:hidden"
        placeholder="Buscar cerveja, gelo, whisky…"
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
      <header className="bg-primaria text-primaria-texto pt-3 pb-3 px-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 mb-3 max-w-[1100px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1" aria-label={`${loja.nome} — início`}>
            {loja.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo da loja (store_settings)
              <img src={loja.logo_url} alt="" className="w-10 h-10 rounded-full object-cover bg-white shrink-0" />
            ) : (
              <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center font-black shrink-0" aria-hidden="true">
                {loja.nome.charAt(0)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[16px] font-black leading-tight truncate">{loja.nome}</span>
              <span className="flex items-center gap-1.5 text-[12px] font-medium leading-tight">
                <span className={`w-2 h-2 rounded-full ${status.aberta ? 'bg-sucesso' : 'bg-perigo'}`} aria-hidden="true" />
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
            className="relative w-11 h-11 rounded-full bg-white/80 flex items-center justify-center shrink-0"
            aria-label={`Abrir sacola${hidratado && quantidadeTotal ? ` (${quantidadeTotal} itens)` : ''}`}
          >
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {hidratado && <Badge count={quantidadeTotal} />}
          </button>
        </div>
        <div className="max-w-[1100px] mx-auto">
          <Suspense fallback={<div className="h-12 rounded-2xl bg-white" />}>
            <CampoBusca />
          </Suspense>
        </div>
      </header>
    </>
  );
};
