'use client';

import React, { useId, useState } from 'react';
import { Minus, Plus, Snowflake } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import {
  descontoDoBloco,
  detalheVariante,
  ofertaPromocional,
  precoCheio,
  precoPorUnidade,
  rotuloOferta,
  rotuloPadrao,
  rotuloVariante,
  descreverVariante,
  tabelaDePrecos,
} from '@/lib/ofertas';
import {
  blocoEmDestaque,
  blocosComDesconto,
  descreverPromocao,
  melhorPreco,
  proximaPromocao,
  UNIDADES_MAXIMAS,
} from '@/lib/precoQuantidade';
import type { Produto, Variante } from '@/lib/tipos';
import { toastEvent } from '@/components/ui/Toast';
import { ImagemProduto } from './ImagemProduto';

/** Selo "Natural/quente" (produto quente ou versão natural escolhida). */
export const SeloTemperatura: React.FC<{ quente: boolean }> = ({ quente }) => {
  if (!quente) return null;
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFE7CC] text-[#8A4B00]">
      Natural/quente
    </span>
  );
};

/**
 * Explica o preço da quantidade em palavras de mercado ("3 por R$ 11,00 + 1 avulsa R$ 4,00") e,
 * com `aoSomar`, avisa quanto custa fechar a próxima promoção ("Leve mais 2 por R$ 7,00").
 * Usado na ficha do produto e na sacola (26/10/2026).
 */
export const ResumoCombinacao: React.FC<{
  produto: Produto;
  unidades: number;
  className?: string;
  aoSomar?: (unidades: number) => void;
}> = ({ produto, unidades, className = '', aoSomar }) => {
  const preco = melhorPreco(produto, unidades, false);
  const combinacao = preco.economia > 0 ? descreverPromocao(preco.partes, formatarPreco) : null;
  const proxima = aoSomar ? proximaPromocao(produto, unidades) : null;
  if (!combinacao && !proxima) return null;
  return (
    <div className={className}>
      {combinacao && <p className="text-[13px] text-sucesso font-medium">Promoção aplicada: {combinacao}</p>}
      {proxima && aoSomar && (
        <button
          type="button"
          onClick={() => aoSomar(proxima.mais)}
          className="mt-1.5 w-full flex items-center justify-between gap-2 rounded-xl bg-[#E7F6EC] text-[#0B5D3B] px-3 py-2 text-left text-[13px]"
        >
          <span>
            Leve <strong>mais {proxima.mais} por {formatarPreco(proxima.custo)}</strong>
            {unidades >= (blocoEmDestaque(produto)?.qtd ?? Infinity) ? ' e feche outra promoção' : ' e feche a promoção'}
          </span>
          <span className="shrink-0 rounded-lg bg-sucesso text-white font-bold px-2.5 py-1">+{proxima.mais}</span>
        </button>
      )}
    </div>
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
  const { adicionar, adicionarVariante } = useCart();
  // null = versão padrão (preço por quantidade); senão o id da variante escolhida
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const idVersoes = useId();

  const variante: Variante | null = produto.variantes.find((v) => v.id === varianteId) ?? null;
  const tabela = tabelaDePrecos(produto.ofertas);
  const temBlocos = tabela.some((o) => o.qtd > 1);
  // atalhos = os blocos de verdade do produto ("3 por R$ 11,00", "Pack 12"): tocar põe essa quantidade
  const atalhos = blocosComDesconto(produto).slice(0, 3);

  // padrão: quantidade em unidades; variante: em blocos com preço fechado
  const preco = variante ? null : melhorPreco(produto, quantidade, false);
  const total = variante ? Math.round(variante.preco * quantidade * 100) / 100 : preco!.total;
  const totalCartao = variante
    ? Math.round(variante.preco_cartao * quantidade * 100) / 100
    : melhorPreco(produto, quantidade, true).total;

  const mudar = (nova: number) => setQuantidade(Math.max(1, Math.min(UNIDADES_MAXIMAS, nova)));
  const escolher = (id: string | null) => {
    setVarianteId(id);
    setQuantidade(1);
  };

  const confirmar = () => {
    if (variante) {
      adicionarVariante(produto.id, variante.id, quantidade);
      const detalhe = detalheVariante(variante);
      toastEvent.show(`${quantidade}× ${produto.nome} · ${rotuloVariante(variante)}${detalhe ? ` (${detalhe})` : ''} na sacola`);
    } else {
      adicionar(produto.id, quantidade);
      toastEvent.show(`${quantidade} un · ${produto.nome}${produto.quente ? ' natural' : ''} na sacola`);
    }
    aoAdicionar?.();
  };

  const unidadePadrao = melhorPreco(produto, 1, false).total;
  // preço da unidade (o que cada lata avulsa custa); a promoção aparece como "3 por R$ 11,00"
  // nos atalhos e no resumo, não como um preço por unidade quebrado (R$ 3,67)
  const precoMostrado = variante ? variante.preco : unidadePadrao;
  const natural = produto.quente || variante?.quente === true;
  const etiqueta = 'text-[13px] font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1.5';
  const titulo = React.createElement(
    paginaPropria ? 'h1' : 'h2',
    { id: idTitulo, className: 'text-[17px] leading-snug text-tinta' },
    produto.nome,
  );

  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-4 ${paginaPropria ? '' : 'bg-bloco px-4 pt-14 pb-10'}`}>
        <div className="w-28 h-28 shrink-0 bg-white rounded-2xl border border-[#E8E8E8] overflow-hidden flex items-center justify-center p-2">
          <ImagemProduto produto={produto} tamanho="grande" />
        </div>
        <div className="min-w-0">
          {titulo}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            <span className="text-[24px] font-bold tabular-nums leading-none text-tinta">{formatarPreco(precoMostrado)}</span>
            {variante && variante.qtd > 1 && <span className="text-[13px] text-suave">{detalheVariante(variante)}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {natural ? (
              <span className={`${etiqueta} bg-[#FFE7CC] text-[#8A4B00]`}>Natural</span>
            ) : (
              <span className={`${etiqueta} bg-white text-tinta`}>
                <Snowflake className="w-4 h-4 text-[#1E7FB8]" aria-hidden="true" />
                Gelado
              </span>
            )}
            {produto.retornavel && <span className={`${etiqueta} bg-[#E7F6EC] text-sucesso`}>Retornável</span>}
            {produto.selo && <span className={`${etiqueta} bg-desconto text-white`}>{produto.selo}</span>}
          </div>
        </div>
      </div>

      <div className={paginaPropria ? 'mt-5' : 'relative -mt-6 bg-white rounded-t-3xl px-4 pt-5 pb-6'}>
        {paginaPropria && produto.descricao && <p className="text-[14px] text-suave mb-4 leading-relaxed">{produto.descricao}</p>}

        {produto.variantes.length > 0 && (
          <div role="radiogroup" aria-labelledby={idVersoes} className="mb-4">
            <span id={idVersoes} className="sr-only">
              Versão
            </span>
            <div className="flex flex-wrap gap-2">
              {[null, ...produto.variantes].map((v) => {
                const selecionada = (v?.id ?? null) === varianteId;
                return (
                  <button
                    key={v?.id ?? 'padrao'}
                    type="button"
                    role="radio"
                    aria-checked={selecionada}
                    onClick={() => escolher(v?.id ?? null)}
                    className={`h-10 px-4 rounded-full border text-[14px] ${
                      selecionada ? 'border-tinta bg-tinta text-white font-bold' : 'border-borda bg-white text-tinta'
                    }`}
                  >
                    {v ? descreverVariante(v) : rotuloPadrao(produto)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between h-14 rounded-2xl border border-[#D6D6D6] px-1.5">
          <button
            type="button"
            onClick={() => mudar(quantidade - 1)}
            disabled={quantidade <= 1}
            aria-label="Diminuir quantidade"
            className="w-12 h-12 flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-6 h-6" aria-hidden="true" />
          </button>
          <span
            className="text-[18px] tabular-nums"
            aria-live="polite"
            aria-label={variante ? `Quantidade: ${quantidade}` : `Quantidade: ${quantidade} unidades`}
          >
            {quantidade}
          </span>
          <button
            type="button"
            onClick={() => mudar(quantidade + 1)}
            aria-label="Aumentar quantidade"
            className="w-12 h-12 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {!variante && atalhos.length > 0 && (
          <div className="flex gap-2.5 mt-3">
            {atalhos.map((b) => {
              const escolhido = quantidade === b.qtd;
              return (
                <button
                  key={b.qtd}
                  type="button"
                  onClick={() => mudar(b.qtd)}
                  aria-pressed={escolhido}
                  className={`flex-1 min-h-12 rounded-2xl border-2 px-2 py-1.5 text-[14px] font-bold leading-tight flex flex-col items-center justify-center ${
                    escolhido ? 'border-sucesso bg-[#E7F6EC] text-[#0B5D3B]' : 'border-[#D6D6D6] bg-white text-tinta'
                  }`}
                >
                  <span>{b.qtd} por</span>
                  <span className="tabular-nums">{formatarPreco(b.preco)}</span>
                </button>
              );
            })}
          </div>
        )}

        {paginaPropria && !variante && temBlocos && (
          <section className="mt-5" aria-labelledby={`${produto.id}-tabela`}>
            <h3 id={`${produto.id}-tabela`} className="text-[14px] font-bold mb-2">
              Quanto mais, mais barato
            </h3>
            <ul className="flex flex-col gap-1.5">
              {tabela.map((o) => {
                const porUnidade = precoPorUnidade(o, 'pix');
                const descontoBloco = descontoDoBloco(o, unidadePadrao);
                return (
                  <li key={o.qtd} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-borda">
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[14px] font-semibold">{rotuloOferta(o)}</span>
                        {descontoBloco > 0 ? (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-desconto text-white">-{descontoBloco}%</span>
                        ) : (
                          ofertaPromocional(o) && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-desconto text-white">Promo</span>
                          )
                        )}
                      </span>
                      {porUnidade != null && (
                        <span className="block text-[12px] text-suave">
                          {o.qtd} un · {formatarPreco(porUnidade)} cada
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {descontoBloco > 0 && (
                        <span className="block text-[11px] text-suave line-through">{formatarPreco(precoCheio(o, unidadePadrao))}</span>
                      )}
                      <span className="text-[15px] font-bold">{formatarPreco(o.preco)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* na ficha os atalhos já mostram a promoção; o aviso "Leve mais 2" fica só na sacola */}
        {!variante && <ResumoCombinacao produto={produto} unidades={quantidade} className="mt-3 text-center" />}
        {totalCartao !== total && (
          <p className="text-[12px] text-suave mt-1 text-center">No cartão (na entrega): {formatarPreco(totalCartao)}</p>
        )}

        <button
          type="button"
          onClick={confirmar}
          className="mt-4 w-full h-14 rounded-2xl bg-primaria text-primaria-texto font-bold text-[17px] active:scale-[0.99] transition-transform tabular-nums"
        >
          Adicionar ({quantidade}) • {formatarPreco(total)}
        </button>
      </div>
    </div>
  );
};
