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
  tabelaDePrecos,
} from '@/lib/ofertas';
import { atalhosDoProduto, descreverCombinacao, melhorPreco, UNIDADES_MAXIMAS } from '@/lib/precoQuantidade';
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

/** "1 pack de 12 + 1 un · economia de R$ 2,00" — explica o preço da quantidade. */
export const ResumoCombinacao: React.FC<{ produto: Produto; unidades: number; className?: string }> = ({
  produto,
  unidades,
  className = '',
}) => {
  const preco = melhorPreco(produto, unidades, false);
  const combinacao = descreverCombinacao(preco.partes);
  // combinação sem desconto (pack pelo mesmo preço das unidades) não precisa de explicação
  if (!combinacao || preco.economia <= 0) return null;
  return (
    <p className={`text-[12px] text-suave ${className}`}>
      {combinacao}
      <span className="text-sucesso font-medium"> · economia de {formatarPreco(preco.economia)}</span>
    </p>
  );
};

interface ProdutoDetalheProps {
  produto: Produto;
  idTitulo?: string;
  /** true na página do produto (título vira h1); no modal fica h2. */
  paginaPropria?: boolean;
  aoAdicionar?: () => void;
}

/** Botão de rádio de versão (padrão ou variante). */
const OpcaoVersao: React.FC<{
  selecionada: boolean;
  aoEscolher: () => void;
  titulo: string;
  detalhe: string | null;
  preco: string;
  icone?: React.ReactNode;
}> = ({ selecionada, aoEscolher, titulo, detalhe, preco, icone }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selecionada}
    onClick={aoEscolher}
    className={`w-full flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors ${
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
      <span className="flex items-center gap-1.5 text-[14px] font-semibold">
        {icone}
        {titulo}
      </span>
      {detalhe && <span className="block text-[12px] text-suave mt-0.5">{detalhe}</span>}
    </span>
    <span className="text-[14px] font-bold shrink-0 tabular-nums">{preco}</span>
  </button>
);

export const ProdutoDetalhe: React.FC<ProdutoDetalheProps> = ({ produto, idTitulo, paginaPropria, aoAdicionar }) => {
  const { adicionar, adicionarVariante, unidadesDoProduto, quantidadeNaLinha } = useCart();
  // null = versão padrão (preço por quantidade); senão o id da variante escolhida
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const idVersoes = useId();

  const variante: Variante | null = produto.variantes.find((v) => v.id === varianteId) ?? null;
  const tabela = tabelaDePrecos(produto.ofertas);
  const temBlocos = tabela.some((o) => o.qtd > 1);
  const atalhos = atalhosDoProduto(produto);

  // padrão: quantidade em unidades; variante: em blocos com preço fechado
  const preco = variante ? null : melhorPreco(produto, quantidade, false);
  const total = variante ? Math.round(variante.preco * quantidade * 100) / 100 : preco!.total;
  const totalCartao = variante
    ? Math.round(variante.preco_cartao * quantidade * 100) / 100
    : melhorPreco(produto, quantidade, true).total;
  const naLinha = quantidadeNaLinha(variante ? `of:${variante.id}` : produto.id);
  const naSacola = unidadesDoProduto(produto.id);

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
  const temNatural = produto.variantes.some((v) => v.quente);

  return (
    <div className="flex flex-col">
      <div className="w-full h-[220px] sm:h-[260px] bg-white rounded-lg border border-[#EFEFEF] overflow-hidden flex items-center justify-center p-3">
        <ImagemProduto produto={produto} tamanho="grande" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {produto.selo && (
          <span className="bg-desconto text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">{produto.selo}</span>
        )}
        {produto.retornavel && (
          <span className="bg-[#E7F6EC] text-sucesso text-[11px] font-bold px-1.5 py-0.5 rounded-md">Retornável</span>
        )}
        <SeloTemperatura quente={produto.quente || variante?.quente === true} />
      </div>

      {React.createElement(
        paginaPropria ? 'h1' : 'h2',
        { id: idTitulo, className: 'text-[20px] font-bold leading-tight mt-1.5' },
        produto.nome,
      )}
      {produto.descricao && <p className="text-[14px] text-suave mt-1.5 leading-relaxed">{produto.descricao}</p>}

      {produto.variantes.length > 0 && (
        <fieldset className="mt-4">
          <legend id={idVersoes} className="text-[14px] font-bold mb-2">
            Escolha a versão
          </legend>
          <div role="radiogroup" aria-labelledby={idVersoes} className="flex flex-col gap-2">
            <OpcaoVersao
              selecionada={!variante}
              aoEscolher={() => escolher(null)}
              titulo={rotuloPadrao(produto)}
              detalhe={temBlocos ? 'Preço por quantidade' : null}
              preco={`${formatarPreco(unidadePadrao)} un`}
              icone={temNatural ? <Snowflake className="w-3.5 h-3.5" aria-hidden="true" /> : undefined}
            />
            {produto.variantes.map((v) => {
              // pack com preço fechado mostra quanto sai cada unidade
              const detalhe = [detalheVariante(v), v.qtd > 1 ? `${formatarPreco(v.preco / v.qtd)}/un` : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <OpcaoVersao
                  key={v.id}
                  selecionada={variante?.id === v.id}
                  aoEscolher={() => escolher(v.id)}
                  titulo={rotuloVariante(v)}
                  detalhe={detalhe || null}
                  preco={formatarPreco(v.preco)}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      {!variante && temBlocos && (
        <section className="mt-4" aria-labelledby={`${produto.id}-tabela`}>
          <h3 id={`${produto.id}-tabela`} className="text-[14px] font-bold">
            Quanto mais, mais barato
          </h3>
          <p className="text-[12px] text-suave mb-2">Escolha a quantidade: a sacola monta sozinha a combinação mais barata.</p>
          <ul className="flex flex-col gap-1.5">
            {tabela.map((o) => {
              const porUnidade = precoPorUnidade(o, 'pix');
              // preço riscado = as mesmas unidades avulsas; selo com o desconto do bloco
              const desconto = descontoDoBloco(o, unidadePadrao);
              return (
                <li key={o.qtd} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-borda">
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14px] font-semibold">{rotuloOferta(o)}</span>
                      {desconto > 0 ? (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-desconto text-white">-{desconto}%</span>
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
                    {desconto > 0 && (
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

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => mudar(quantidade - 1)}
            disabled={quantidade <= 1}
            aria-label="Diminuir quantidade"
            className="w-11 h-11 rounded-full bg-bloco flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>
          <span
            className="w-12 text-center text-[16px] font-bold tabular-nums"
            aria-live="polite"
            aria-label={variante ? `Quantidade: ${quantidade}` : `Quantidade: ${quantidade} unidades`}
          >
            {quantidade}
          </span>
          <button
            type="button"
            onClick={() => mudar(quantidade + 1)}
            aria-label="Aumentar quantidade"
            className="w-11 h-11 rounded-full bg-primaria text-primaria-texto flex items-center justify-center"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {!variante && atalhos.length > 0 && (
          <div className="flex gap-2">
            {atalhos.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => mudar(quantidade === 1 ? n : quantidade + n)}
                className="h-11 px-3.5 rounded-full border border-borda bg-white text-[14px] font-bold"
                aria-label={`${quantidade === 1 ? 'Levar' : 'Somar mais'} ${n} unidades`}
              >
                +{n}
              </button>
            ))}
          </div>
        )}
        {variante && variante.qtd > 1 && (
          <span className="text-[13px] text-suave">
            {quantidade}× {detalheVariante(variante)} = {quantidade * variante.qtd} un
          </span>
        )}
      </div>

      {!variante && <ResumoCombinacao produto={produto} unidades={quantidade} className="mt-2" />}
      {totalCartao !== total && (
        <p className="text-[12px] text-suave mt-1">
          Preço no Pix ou dinheiro. No cartão (na entrega): {formatarPreco(totalCartao)}.
        </p>
      )}
      {naLinha > 0 ? (
        <p className="text-[12px] text-suave mt-1">
          {variante
            ? `Você já tem ${naLinha} dessa versão na sacola.`
            : `Você já tem ${naLinha} un na sacola. O preço final soma tudo e usa a combinação mais barata.`}
        </p>
      ) : (
        naSacola > 0 && (
          <p className="text-[12px] text-suave mt-1">Você já tem {naSacola} un desse produto na sacola, em outra versão.</p>
        )
      )}

      <button
        type="button"
        onClick={confirmar}
        className="mt-4 w-full h-13 py-3.5 rounded-lg bg-primaria text-primaria-texto font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.99] transition-transform"
      >
        <span>Adicionar {!variante && quantidade > 1 ? `${quantidade} un` : ''}</span>
        <span className="tabular-nums">{formatarPreco(total)}</span>
      </button>
    </div>
  );
};
