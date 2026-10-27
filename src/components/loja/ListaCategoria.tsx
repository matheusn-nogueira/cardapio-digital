'use client';

import React, { useMemo, useState } from 'react';
import { useCardapio } from '@/context/CardapioContext';
import type { Produto } from '@/lib/tipos';
import { GradeProdutos } from './GradeProdutos';
import { marcasDoCatalogo } from './MarcasLista';

/**
 * Produtos de uma categoria com filtro por marca. Sem busca própria: a busca do topo fica
 * logo acima e procura em tudo (dono, 27/10/2026: duas buscas empilhadas confundiam).
 */
export const ListaCategoria: React.FC<{ ids: string[] }> = ({ ids }) => {
  const { produtoPorId } = useCardapio();
  const [marca, setMarca] = useState<string | null>(null);

  const produtos = useMemo(
    () => ids.map((id) => produtoPorId.get(id)).filter((p): p is Produto => !!p),
    [ids, produtoPorId],
  );
  const marcas = useMemo(() => marcasDoCatalogo(produtos, 1), [produtos]);
  const filtrados = useMemo(() => (marca ? produtos.filter((p) => p.marca === marca) : produtos), [produtos, marca]);

  return (
    <div>
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
                className={`shrink-0 h-10 px-4 rounded-xl text-[14px] font-medium ${
                  ativa ? 'bg-tinta text-white font-bold' : 'bg-bloco text-tinta'
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
          <p className="text-[13px] mt-1">Limpe o filtro de marca ou use a busca do topo.</p>
        </div>
      )}
    </div>
  );
};
