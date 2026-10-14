'use client';

import React, { useId, useState } from 'react';
import { Minus, Plus, Snowflake } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import {
  ofertaPrincipal,
  ofertaPromocional,
  precoPorUnidade,
  rotuloOferta,
  temVersaoQuente,
} from '@/lib/ofertas';
import { QUANTIDADE_MAXIMA } from '@/lib/carrinho';
import type { Oferta, Produto } from '@/lib/tipos';
import { toastEvent } from '@/components/ui/Toast';
import { ImagemProduto } from './ImagemProduto';

/** Categorias de produto que ganham os atalhos +6 / +12. */
const CATEGORIAS_ATALHO = ['cerveja'];

export const SeloTemperatura: React.FC<{ oferta: Oferta; mostrarGelada: boolean }> = ({ oferta, mostrarGelada }) => {
  if (oferta.quente) {
    return (
      <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFE7CC] text-[#8A4B00]">
        Natural/quente
      </span>
    );
  }
  if (!mostrarGelada) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#DDEEFF] text-[#0B4A8B]">
      <Snowflake className="w-3 h-3" aria-hidden="true" /> Gelada
    </span>
  );
};

interface ProdutoDetalheProps {
  produto: Produto;
  idTitulo?: string;
  /** true na página do produto (título vira h1); no modal fica h2. */
  paginaPropria?: boolean;
  aoAdicionar?: () => void;
}

export const ProdutoDetalhe: React.FC<ProdutoDetalheProps> = ({ produto, idTitulo, paginaPropria, aoAdicionar }) => {
  const { adicionar, quantidadeDaOferta } = useCart();
  const [ofertaId, setOfertaId] = useState(() => ofertaPrincipal(produto).id);
  const [quantidade, setQuantidade] = useState(1);
  const idOfertas = useId();

  const oferta = produto.ofertas.find((o) => o.id === ofertaId) ?? ofertaPrincipal(produto);
  const marcarGelada = temVersaoQuente(produto);
  const comAtalhos = CATEGORIAS_ATALHO.includes(produto.categoria.toLowerCase()) && oferta.qtd === 1;
  const jaNaSacola = quantidadeDaOferta(oferta.id);
  const precoCartaoDiferente = oferta.preco_cartao !== oferta.preco;

  const mudarQuantidade = (nova: number) => setQuantidade(Math.max(1, Math.min(QUANTIDADE_MAXIMA, nova)));

  const confirmar = () => {
    adicionar(oferta.id, quantidade);
    const rotulo = rotuloOferta(oferta, produto);
    toastEvent.show(
      `${quantidade}× ${produto.nome}${rotulo !== 'Unidade' ? ` (${rotulo})` : ''}${oferta.quente ? ' natural' : ''} na sacola`,
    );
    aoAdicionar?.();
  };

  return (
    <div className="flex flex-col">
      <div className="w-full h-[220px] sm:h-[260px] bg-white rounded-2xl overflow-hidden flex items-center justify-center p-3">
        <ImagemProduto produto={produto} tamanho="grande" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {produto.selo && (
          <span className="bg-tinta text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">{produto.selo}</span>
        )}
        {produto.retornavel && (
          <span className="bg-[#E7F6EC] text-sucesso text-[11px] font-bold px-1.5 py-0.5 rounded-md">Retornável</span>
        )}
        {produto.ofertas.length === 1 && <SeloTemperatura oferta={oferta} mostrarGelada={false} />}
      </div>

      {React.createElement(
        paginaPropria ? 'h1' : 'h2',
        { id: idTitulo, className: 'text-[20px] font-bold leading-tight mt-1.5' },
        produto.nome,
      )}
      {produto.descricao && <p className="text-[14px] text-suave mt-1.5 leading-relaxed">{produto.descricao}</p>}

      {produto.ofertas.length > 1 && (
        <fieldset className="mt-4">
          <legend id={idOfertas} className="text-[14px] font-bold mb-2">
            Como você quer levar?
          </legend>
          <div role="radiogroup" aria-labelledby={idOfertas} className="flex flex-col gap-2">
            {produto.ofertas.map((o) => {
              const selecionada = o.id === oferta.id;
              const porUnidade = precoPorUnidade(o, 'pix');
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  onClick={() => {
                    setOfertaId(o.id);
                    setQuantidade(1);
                  }}
                  className={`w-full flex items-center gap-3 text-left p-3 rounded-xl border-2 transition-colors ${
                    selecionada ? 'border-primaria bg-primaria/10' : 'border-borda bg-white'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selecionada ? 'border-tinta' : 'border-[#BDBDBD]'
                    }`}
                    aria-hidden="true"
                  >
                    {selecionada && <span className="w-2.5 h-2.5 rounded-full bg-tinta" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14px] font-semibold">{rotuloOferta(o, produto)}</span>
                      {ofertaPromocional(o) && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-perigo text-white">Promo</span>
                      )}
                      <SeloTemperatura oferta={o} mostrarGelada={marcarGelada} />
                    </span>
                    {porUnidade != null && (
                      <span className="block text-[12px] text-suave mt-0.5">
                        {o.qtd} un · {formatarPreco(porUnidade)} cada
                      </span>
                    )}
                  </span>
                  <span className="text-[15px] font-bold shrink-0">{formatarPreco(o.preco)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {precoCartaoDiferente && (
        <p className="text-[12px] text-suave mt-2">
          Preço no Pix ou dinheiro. No cartão (na entrega): {formatarPreco(oferta.preco_cartao)}.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center rounded-full border border-borda bg-white">
          <button
            type="button"
            onClick={() => mudarQuantidade(quantidade - 1)}
            disabled={quantidade <= 1}
            aria-label="Diminuir quantidade"
            className="w-11 h-11 flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-[16px] font-bold" aria-live="polite" aria-label={`Quantidade: ${quantidade}`}>
            {quantidade}
          </span>
          <button
            type="button"
            onClick={() => mudarQuantidade(quantidade + 1)}
            aria-label="Aumentar quantidade"
            className="w-11 h-11 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {comAtalhos && (
          <div className="flex gap-2">
            {[6, 12].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => mudarQuantidade(quantidade === 1 ? n : quantidade + n)}
                className="h-11 px-3.5 rounded-full border border-borda bg-white text-[14px] font-bold"
                aria-label={`${quantidade === 1 ? 'Levar' : 'Somar mais'} ${n} unidades`}
              >
                +{n}
              </button>
            ))}
          </div>
        )}
      </div>
      {jaNaSacola > 0 && (
        <p className="text-[12px] text-suave mt-2">Você já tem {jaNaSacola} dessa opção na sacola.</p>
      )}

      <button
        type="button"
        onClick={confirmar}
        className="mt-4 w-full h-13 py-3.5 rounded-xl bg-primaria text-primaria-texto font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.99] transition-transform"
      >
        <span>Adicionar</span>
        <span>{formatarPreco(oferta.preco * quantidade)}</span>
      </button>
    </div>
  );
};
