'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { filtrarPorTermo } from '@/lib/busca';
import type { Produto } from '@/lib/tipos';
import { GradeProdutos } from './GradeProdutos';
import { marcasDoCatalogo } from './MarcasLista';

/** Produtos de uma categoria com filtro por marca e busca local. */
export const ListaCategoria: React.FC<{ ids: string[]; nomeCategoria: string }> = ({ ids, nomeCategoria }) => {
  const { produtoPorId } = useCardapio();
  const [marca, setMarca] = useState<string | null>(null);
  const [termo, setTermo] = useState('');

  const produtos = useMemo(
    () => ids.map((id) => produtoPorId.get(id)).filter((p): p is Produto => !!p),
    [ids, produtoPorId],
  );
  const marcas = useMemo(() => marcasDoCatalogo(produtos, 1), [produtos]);
  const filtrados = useMemo(() => {
    const porMarca = marca ? produtos.filter((p) => p.marca === marca) : produtos;
    return filtrarPorTermo(porMarca, termo);
  }, [produtos, marca, termo]);

  return (
    <div>
      <div className="relative mb-3">
        <label htmlFor="busca-categoria" className="sr-only">
          Buscar em {nomeCategoria}
        </label>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-suave pointer-events-none" aria-hidden="true" />
        <input
          id="busca-categoria"
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={`Buscar em ${nomeCategoria}`}
          className="w-full h-11 pl-10 pr-3 rounded-lg bg-white border border-borda text-[16px] outline-none focus:border-topo placeholder:text-[14px] placeholder:text-[#9B9B9B]"
        />
      </div>

      {marcas.length > 1 && (
        <div role="group" aria-label="Filtrar por marca" className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3">
          {[null, ...marcas].map((m) => {
            const ativa = marca === m;
            return (
              <button
                key={m ?? 'todas'}
                type="button"
                aria-pressed={ativa}
                onClick={() => setMarca(m)}
                className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-medium border ${
                  ativa ? 'bg-topo text-white border-topo' : 'bg-white text-tinta border-borda'
                }`}
              >
                {m ?? 'Todas'}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[13px] text-suave mb-3" aria-live="polite">
        {filtrados.length === 1 ? '1 produto' : `${filtrados.length} produtos`}
      </p>

      {filtrados.length ? (
        <GradeProdutos produtos={filtrados} />
      ) : (
        <div className="text-center py-12 text-suave">
          <p className="text-[15px] font-medium text-tinta">Nada encontrado</p>
          <p className="text-[13px] mt-1">Tente outra palavra ou limpe o filtro de marca.</p>
        </div>
      )}
    </div>
  );
};
