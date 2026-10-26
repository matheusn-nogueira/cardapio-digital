'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { formatarPreco } from '@/lib/formatacao';
import { freteFinal, progressoMinimo } from '@/lib/carrinho';
import { useArmazem } from '@/lib/armazenamento';
import { armazemRetirada } from '@/lib/estado-checkout';
import { useFrete } from '@/lib/frete';
import { detalheVariante, descreverVariante } from '@/lib/ofertas';
import { subtotalCarrinho, totalDaLinha } from '@/lib/precoQuantidade';
import { ImagemProduto } from '@/components/loja/ImagemProduto';
import { PecaTambem } from '@/components/loja/PecaTambem';
import { ResumoCombinacao, SeloTemperatura } from '@/components/loja/ProdutoDetalhe';

/** Barra de progresso com texto (pedido mínimo / frete grátis). */
export const BarraProgresso: React.FC<{ percentual: number; texto: string; completo: boolean }> = ({
  percentual,
  texto,
  completo,
}) => (
  <div>
    <p className={`text-[13px] font-medium mb-1.5 ${completo ? 'text-sucesso' : 'text-tinta'}`}>{texto}</p>
    <div
      className="h-2 rounded-full bg-[#E3E3E3] overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentual}
      aria-label={texto}
    >
      <div
        className={`h-full rounded-full transition-all ${completo ? 'bg-sucesso' : 'bg-primaria'}`}
        style={{ width: `${percentual}%` }}
      />
    </div>
  </div>
);

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { home, status } = useCardapio();
  const { linhas, indisponiveis, subtotal, alterar, remover, removerIndisponiveis, sacolaAberta, fecharSacola, limpar } =
    useCart();
  const botaoFechar = useRef<HTMLButtonElement>(null);
  // "Esvaziar" pede confirmação na própria sacola (um toque sem querer apagaria tudo)
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);
  const { config } = home;
  const freteSalvo = useFrete();
  const [retirada] = useArmazem(armazemRetirada);

  useEffect(() => {
    if (!sacolaAberta) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharSacola();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
      anterior?.focus?.();
      setConfirmandoLimpar(false); // reabrir a sacola não traz a confirmação de volta
    };
  }, [sacolaAberta, fecharSacola]);

  if (!sacolaAberta) return null;

  const minimo = progressoMinimo(subtotal, config.pedido_minimo);
  const freteGratis =
    config.frete_gratis_acima != null && config.frete_gratis_acima > 0
      ? progressoMinimo(subtotal, config.frete_gratis_acima)
      : null;
  const subtotalCartao = subtotalCarrinho(linhas, true);
  const freteGuardado = freteSalvo?.resultado;
  // taxa já conhecida (endereço guardado de outro pedido); null = ainda sem endereço
  const entregaConhecida =
    freteGuardado && !freteGuardado.bloqueado && freteGuardado.frete != null
      ? freteFinal(freteGuardado.frete, subtotal, config.frete_gratis_acima)
      : null;
  const vazia = linhas.length === 0;

  const continuar = () => {
    fecharSacola();
    router.push('/checkout');
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 animate-fade-in" onClick={fecharSacola} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-sacola"
        className="fixed top-0 right-0 bottom-0 z-[101] w-[400px] max-w-full bg-fundo flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.12)] animate-entra-direita"
      >
        <div className="flex items-center justify-center relative px-4 h-14 bg-white text-tinta border-b border-[#EFEFEF] shrink-0">
          {linhas.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmandoLimpar(true)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-11 px-2.5 text-[14px] font-bold text-perigo"
            >
              Esvaziar
            </button>
          )}
          <h2 id="titulo-sacola" className="text-[16px] font-bold">
            Sua sacola
          </h2>
          <button
            ref={botaoFechar}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-tinta"
            onClick={fecharSacola}
            aria-label="Fechar sacola"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 pb-3">
          {confirmandoLimpar && linhas.length > 0 && (
            <div className="mt-3 rounded-xl bg-white border-2 border-perigo/40 p-3.5" role="alertdialog" aria-label="Esvaziar a sacola">
              <p className="text-[15px] font-bold">Tirar todos os itens da sacola?</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setConfirmandoLimpar(false)}
                  className="flex-1 h-11 rounded-xl border border-borda bg-white text-[15px] font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    limpar();
                    setConfirmandoLimpar(false);
                  }}
                  className="flex-1 h-11 rounded-xl bg-perigo text-white text-[15px] font-bold"
                >
                  Esvaziar sacola
                </button>
              </div>
            </div>
          )}
          {!status.aberta && (
            <div className="mt-3 rounded-lg bg-[#FFF1F1] border border-[#F5C2C2] p-3 text-[13px]">
              <strong className="text-perigo">Estamos fechados agora.</strong> Você pode montar a sacola, mas só dá para
              fazer o pedido quando abrirmos{status.detalhe ? ` (${status.detalhe.toLowerCase()})` : ''}.
            </div>
          )}

          {!vazia && (minimo.exige || freteGratis) && (
            <div className="mt-3 bg-white rounded-lg p-3 space-y-3">
              {minimo.exige && (
                <BarraProgresso
                  percentual={minimo.percentual}
                  completo={minimo.atingido}
                  texto={
                    minimo.atingido
                      ? 'Pedido mínimo atingido'
                      : `Faltam ${formatarPreco(minimo.falta)} para o pedido mínimo (${formatarPreco(config.pedido_minimo)})`
                  }
                />
              )}
              {freteGratis && (
                <BarraProgresso
                  percentual={freteGratis.percentual}
                  completo={freteGratis.atingido}
                  texto={
                    freteGratis.atingido
                      ? 'Entrega grátis garantida'
                      : `Faltam ${formatarPreco(freteGratis.falta)} para a entrega grátis`
                  }
                />
              )}
            </div>
          )}

          {indisponiveis > 0 && (
            <div className="mt-3 rounded-lg bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[13px] flex items-center gap-2">
              <span className="flex-1">
                {indisponiveis === 1
                  ? '1 item da sua sacola não está mais disponível.'
                  : `${indisponiveis} itens da sua sacola não estão mais disponíveis.`}
              </span>
              <button type="button" onClick={removerIndisponiveis} className="font-bold underline py-1">
                Remover
              </button>
            </div>
          )}

          {vazia ? (
            <div className="text-center py-16 px-5 text-suave">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" aria-hidden="true" />
              <p className="text-[15px] font-medium mb-1 text-tinta">Sua sacola está vazia</p>
              <p className="text-[13px]">Escolha suas bebidas no cardápio e elas aparecem aqui.</p>
            </div>
          ) : (
            <ul>
              {linhas.map((linha) => {
                const { chave, produto, variante, quantidade } = linha;
                return (
                  <li key={chave} className="bg-white rounded-lg shadow-cartao p-3 mt-2.5 flex gap-3 items-start">
                    <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden">
                      <ImagemProduto produto={produto} tamanho="pequena" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-tight">{produto.nome}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <SeloTemperatura quente={produto.quente || variante?.quente === true} />
                        {variante && (
                          <span className="text-[12px] text-suave">
                            {variante.quente ? detalheVariante(variante) : descreverVariante(variante)}
                            {variante.qtd > 1 ? ` · ${quantidade * variante.qtd} un` : ''}
                          </span>
                        )}
                      </div>
                      {!variante && (
                        <ResumoCombinacao
                          produto={produto}
                          unidades={quantidade}
                          aoSomar={(n) => alterar(chave, quantidade + n)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="w-9 h-9 rounded-full bg-bloco flex items-center justify-center"
                            onClick={() => alterar(chave, quantidade - 1)}
                            aria-label={`Diminuir ${produto.nome}`}
                          >
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <span
                            className="min-w-8 px-1 text-center text-[14px] font-bold tabular-nums"
                            aria-label={variante ? `${quantidade}` : `${quantidade} unidades`}
                          >
                            {quantidade}
                          </span>
                          <button
                            type="button"
                            className="w-9 h-9 rounded-full bg-primaria text-primaria-texto flex items-center justify-center"
                            onClick={() => alterar(chave, quantidade + 1)}
                            aria-label={`Aumentar ${produto.nome}`}
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="text-[15px] font-bold tabular-nums">{formatarPreco(totalDaLinha(linha, false))}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-9 h-9 -mr-1 -mt-1 flex items-center justify-center text-suave hover:text-perigo"
                      onClick={() => remover(chave)}
                      aria-label={`Remover ${produto.nome} da sacola`}
                    >
                      <Trash2 className="w-[18px] h-[18px]" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!vazia && <PecaTambem />}
        </div>

        <div className="bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shrink-0 border-t border-borda">
          {/* taxa de entrega à vista desde a sacola (custo surpresa no fim é o que mais faz desistir):
              com endereço já guardado, o valor certo e o total; sem endereço, "a partir de" */}
          <div className="flex justify-between text-[15px]">
            <span>Itens</span>
            <span className="tabular-nums">{formatarPreco(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[15px] mt-0.5">
            <span>{retirada ? 'Retirada na loja' : 'Entrega'}</span>
            <span className="tabular-nums">
              {retirada
                ? 'Grátis'
                : entregaConhecida != null
                  ? entregaConhecida === 0
                    ? 'Grátis'
                    : formatarPreco(entregaConhecida)
                  : home.frete_minimo != null
                    ? `a partir de ${formatarPreco(home.frete_minimo)}`
                    : 'no próximo passo'}
            </span>
          </div>
          {(retirada || entregaConhecida != null) && (
            <div className="flex justify-between text-[17px] font-black mt-1.5 pt-1.5 border-t border-borda">
              <span>Total</span>
              <span className="tabular-nums">{formatarPreco(subtotal + (retirada ? 0 : (entregaConhecida ?? 0)))}</span>
            </div>
          )}
          {subtotalCartao !== subtotal && (
            <p className="text-[12px] text-suave mt-1">No cartão, os itens ficam {formatarPreco(subtotalCartao)}.</p>
          )}

          <button
            type="button"
            className="w-full mt-3 h-13 py-3.5 rounded-lg text-[15px] font-bold transition-all bg-primaria text-primaria-texto disabled:bg-[#DDD] disabled:text-suave"
            onClick={continuar}
            disabled={vazia || !minimo.atingido}
          >
            {vazia
              ? 'Sacola vazia'
              : minimo.atingido
                ? 'Fechar pedido'
                : `Faltam ${formatarPreco(minimo.falta)} para o mínimo`}
          </button>
        </div>
      </div>
    </>
  );
};
