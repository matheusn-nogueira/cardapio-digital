'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Navigation } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { armazemUltimoPedido, nomePagamento } from '@/lib/estado-checkout';
import { formatarPreco } from '@/lib/formatacao';
import { vibrarLeve, vibrarSucesso } from '@/lib/toque';
import { AndamentoPedido } from '@/components/checkout/AndamentoPedido';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';

/** O momento de "deu certo": círculo verde que entra com mola e o "✓" que se desenha dentro dele. */
const SeloConfirmado: React.FC = () => {
  useEffect(() => vibrarSucesso(), []);
  return (
    <div className="w-16 h-16 mx-auto rounded-full bg-sucesso flex items-center justify-center animate-circulo-entra" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
        {/* pathLength 1: o traço vai de 0 a 1 em desenha, qualquer que seja o tamanho do caminho */}
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength={1}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          className="animate-desenha"
        />
      </svg>
    </div>
  );
};

export default function ConfirmationPage() {
  const hidratado = useHidratado();
  const { home } = useCardapio();
  const [pedido] = useArmazem(armazemUltimoPedido);
  const [copiado, setCopiado] = useState(false);
  const { config, loja } = home;
  const rotaLoja =
    loja.latitude != null && loja.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loja.latitude},${loja.longitude}`)}`
      : null;

  if (!hidratado) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout />
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout voltarPara="/" />
        <div className="text-center px-6 py-16">
          <p className="text-[17px] font-bold">Nenhum pedido recente por aqui</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-xl bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  // pedido de retirada: o endereço guardado começa com "Retirada na loja"
  const retirada = pedido.endereco.startsWith('Retirada');

  const copiarPix = async () => {
    if (!config.chave_pix) return;
    try {
      await navigator.clipboard.writeText(config.chave_pix);
      vibrarLeve();
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sem permissão de área de transferência: a chave continua visível para copiar à mão
    }
  };

  return (
    <main className="bg-fundo min-h-screen flex flex-col">
      <CabecalhoCheckout />

      <div className="flex-1 w-full max-w-[480px] mx-auto px-4 py-8 text-center animate-fade-in">
        <SeloConfirmado />
        <h1 className="font-condensed text-[26px] font-bold uppercase tracking-[0.02em] leading-none mt-4">Pedido recebido!</h1>
        <p className="text-[15px] text-suave mt-1">
          Pedido <strong className="text-tinta">#{pedido.numero}</strong> · {formatarPreco(pedido.total)}
        </p>
        {pedido.repetido && (
          <p className="mt-3 text-[13px] text-suave">
            Esse pedido já tinha chegado na loja na primeira tentativa. Nada foi enviado em dobro.
          </p>
        )}
        {/* Pix primeiro: pagar é a ação de agora */}
        {pedido.pagamento === 'pix' && (
          <section className="bg-white rounded-xl p-4 mt-5 text-left shadow-cartao" aria-labelledby="titulo-pix">
            <h2 id="titulo-pix" className="text-[15px] font-bold">
              Pague com Pix
            </h2>
            {config.chave_pix ? (
              <>
                <p className="text-[13px] text-suave mt-1">Faça o Pix de {formatarPreco(pedido.total)} para a chave abaixo.</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 break-all bg-fundo rounded-xl px-3 py-2.5 text-[14px]">{config.chave_pix}</code>
                  <button
                    type="button"
                    onClick={copiarPix}
                    aria-live="polite"
                    // copiado: o botão fica verde com o "✓" por 2 s, para não restar dúvida de que foi
                    className={`h-11 px-3 rounded-xl border-2 font-bold text-[13px] flex items-center gap-1.5 shrink-0 transition-colors duration-200 ${
                      copiado ? 'bg-sucesso border-sucesso text-white' : 'border-tinta text-tinta'
                    }`}
                  >
                    {copiado ? <Check className="w-4 h-4 animate-pulo" strokeWidth={3} aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-suave mt-1">A chave Pix chega junto com a confirmação da loja.</p>
            )}
          </section>
        )}

        <AndamentoPedido
          pedidoId={pedido.pedidoId}
          retirada={retirada}
          previsao={
            retirada
              ? 'Avisamos quando estiver pronto para retirar.'
              : `Entrega estimada: ${config.tempo_entrega_min}–${config.tempo_entrega_max} min`
          }
        />
        {/* "Como chegar" só depois do pedido feito (na etapa 2 tirava a pessoa do site antes de fechar) */}
        {retirada && rotaLoja && (
          <div className="mt-3">
            <p className="text-[14px] text-suave">{[loja.endereco, loja.bairro].filter(Boolean).join(' · ')}</p>
            <a
              href={rotaLoja}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-tinta bg-white text-[15px] font-bold"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" /> Como chegar
            </a>
          </div>
        )}

        <section className="bg-white rounded-xl p-4 mt-5 text-left shadow-cartao text-[14px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatarPreco(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>{retirada ? 'Retirada na loja' : 'Entrega'}</span>
            <span>{pedido.frete === 0 ? 'Grátis' : formatarPreco(pedido.frete)}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-borda font-black text-[16px]">
            <span>Total</span>
            <span>{formatarPreco(pedido.total)}</span>
          </div>
          <p className="mt-2 text-suave">
            Pagamento: {nomePagamento(pedido.pagamento)}
            {pedido.trocoPara ? ` · troco para ${formatarPreco(pedido.trocoPara)}` : ''}
          </p>
        </section>

        <Link
          href="/"
          onClick={() => armazemUltimoPedido.gravar(null)}
          className="mt-3 w-full h-14 rounded-xl bg-primaria text-primaria-texto font-bold text-[15px] flex items-center justify-center"
        >
          Fazer novo pedido
        </Link>
      </div>
    </main>
  );
}
