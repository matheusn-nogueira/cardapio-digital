'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCardapio } from '@/context/CardapioContext';
import { filtrarPorTermo } from '@/lib/busca';
import { GradeProdutos } from './GradeProdutos';

export const ResultadosBusca: React.FC = () => {
  const params = useSearchParams();
  const termo = params.get('q')?.trim() ?? '';
  const marca = params.get('marca')?.trim() ?? '';
  const { produtos, home, categoriaDoProduto } = useCardapio();

  const resultados = useMemo(() => {
    const base = marca ? produtos.filter((p) => p.marca?.toLowerCase() === marca.toLowerCase()) : produtos;
    return filtrarPorTermo(base, termo, (p) => categoriaDoProduto(p)?.nome ?? '');
  }, [produtos, termo, marca, categoriaDoProduto]);

  const titulo = marca ? marca : termo ? `Resultados para “${termo}”` : 'Buscar';

  return (
    <div>
      <h1 className="text-[20px] font-black leading-tight mb-1">{titulo}</h1>
      {!termo && !marca ? (
        <>
          <p className="text-[14px] text-suave mb-4">Digite o que você procura na busca acima ou escolha uma categoria:</p>
          <ul className="flex flex-wrap gap-2">
            {home.categorias.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categoria/${c.id}`}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-borda text-[14px] font-medium"
                >
                  <span aria-hidden="true">{c.icone}</span> {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-[13px] text-suave mb-3" aria-live="polite">
            {resultados.length === 1 ? '1 produto' : `${resultados.length} produtos`}
          </p>
          {resultados.length ? (
            <GradeProdutos produtos={resultados} />
          ) : (
            <div className="text-center py-12 text-suave">
              <p className="text-[15px] font-medium text-tinta">Não achamos nada com esse nome</p>
              <p className="text-[13px] mt-1">Confira a escrita ou tente algo mais curto, como “brahma” ou “gelo”.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
