import React from 'react';
import Link from 'next/link';
import type { Categoria } from '@/lib/tipos';
import { corSegura } from '@/lib/formatacao';

/** Atalhos de categoria (ícone/imagem + cor de fundo vindos do banco). */
export const CategoriasLista: React.FC<{ categorias: Categoria[]; ativaId?: string }> = ({ categorias, ativaId }) => {
  if (!categorias.length) return null;
  return (
    <nav aria-label="Categorias" className="bg-white py-4 mb-2 shadow-sm">
      <ul className="flex items-start gap-2 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-1">
        {categorias.map((cat) => {
          const ativa = cat.id === ativaId;
          return (
            <li key={cat.id} className="shrink-0">
              <Link
                href={`/categoria/${cat.id}`}
                aria-current={ativa ? 'page' : undefined}
                className="flex flex-col items-center gap-1.5 w-[76px] rounded-xl p-1"
              >
                <span
                  className={`w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center text-[28px] border-2 ${
                    ativa ? 'border-tinta' : 'border-transparent'
                  }`}
                  style={{ background: corSegura(cat.cor_fundo, '#F4F4F4') }}
                  aria-hidden="true"
                >
                  {cat.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem configurada no ERP
                    <img src={cat.imagem_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    cat.icone || '🛒'
                  )}
                </span>
                <span className={`text-[12px] text-center leading-tight text-tinta ${ativa ? 'font-bold' : 'font-medium'}`}>
                  {cat.nome}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
