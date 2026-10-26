'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { armazemUltimoPedido, nomePagamento, PedidoConfirmado } from '@/lib/estado-checkout';
import { formatarPreco, linkWhatsapp } from '@/lib/formatacao';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';

function mensagemWhatsapp(p: PedidoConfirmado): string {
  return [
    `Olá! Acabei de fazer o pedido #${p.numero} pelo cardápio online.`,
    `Nome: ${p.nomeCliente}`,
    '',
    ...p.itens.map((i) => `• ${i}`),
    '',
    `Total: ${formatarPreco(p.total)} (${nomePagamento(p.pagamento)})`,
    p.trocoPara ? `Troco para ${formatarPreco(p.trocoPara)}` : null,
    p.endereco.startsWith('Retirada') ? p.endereco : `Entrega: ${p.endereco}`,
  ]
    .filter((linha) => linha !== null)
    .join('\n');
}

export default function ConfirmationPage() {
  const hidratado = useHidratado();
  const { home } = useCardapio();
  const [pedido] = useArmazem(armazemUltimoPedido);
  const [copiado, setCopiado] = useState(false);
  const { config, loja } = home;

  if (!hidratado) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout />
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="min-h-[70vh] bg-fundo">
        <CabecalhoCheckout voltarPara="/" />
        <div className="text-center px-6 py-16">
          <p className="text-[17px] font-bold">Nenhum pedido recente por aqui</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-lg bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  const whatsapp = linkWhatsapp(config.whatsapp || loja.telefone, mensagemWhatsapp(pedido));

  const copiarPix = async () => {
    if (!config.chave_pix) return;
    try {
      await navigator.clipboard.writeText(config.chave_pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // sem permissão de área de transferência: a chave continua visível para copiar à mão
    }
  };

  return (
    <main className="bg-fundo min-h-screen flex flex-col">
      <CabecalhoCheckout />

      <div className="flex-1 w-full max-w-[480px] mx-auto px-4 py-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-sucesso text-white flex items-center justify-center">
          <Check className="w-9 h-9" strokeWidth={3} aria-hidden="true" />
        </div>
        <h1 className="text-[24px] font-black mt-4">Pedido recebido!</h1>
        <p className="text-[15px] text-suave mt-1">
          Pedido <strong className="text-tinta">#{pedido.numero}</strong> · {formatarPreco(pedido.total)}
        </p>
        {pedido.repetido && (
          <p className="mt-3 text-[13px] text-suave">
            Esse pedido já tinha chegado na loja na primeira tentativa. Nada foi enviado em dobro.
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-2 py-2.5 px-4 bg-[#E7F6EC] rounded-lg text-[14px] font-bold text-sucesso">
          {pedido.endereco.startsWith('Retirada')
            ? 'Avisamos pelo WhatsApp quando estiver pronto para retirar'
            : `Entrega estimada: ${config.tempo_entrega_min}–${config.tempo_entrega_max} min`}
        </p>

        <section className="bg-white rounded-lg p-4 mt-5 text-left shadow-cartao text-[14px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatarPreco(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>{pedido.endereco.startsWith('Retirada') ? 'Retirada na loja' : 'Entrega'}</span>
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

        {pedido.pagamento === 'pix' && (
          <section className="bg-white rounded-lg p-4 mt-3 text-left shadow-cartao" aria-labelledby="titulo-pix">
            <h2 id="titulo-pix" className="text-[14px] font-medium uppercase tracking-wide text-rotulo">
              Pagamento via Pix
            </h2>
            {config.chave_pix ? (
              <>
                <p className="text-[13px] text-suave mt-1">
                  Faça o Pix de {formatarPreco(pedido.total)} para a chave abaixo e mande o comprovante no WhatsApp.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 break-all bg-fundo rounded-lg px-3 py-2.5 text-[14px]">{config.chave_pix}</code>
                  <button
                    type="button"
                    onClick={copiarPix}
                    className="h-11 px-3 rounded-lg border-2 border-tinta font-bold text-[13px] flex items-center gap-1.5 shrink-0"
                  >
                    {copiado ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-suave mt-1">Chame a gente no WhatsApp para receber a chave Pix.</p>
            )}
          </section>
        )}

        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full h-13 py-3.5 rounded-lg bg-[#1F9D55] text-white font-bold text-[15px] flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" /> Falar no WhatsApp
          </a>
        )}

        <Link
          href="/"
          onClick={() => armazemUltimoPedido.gravar(null)}
          className="mt-3 w-full h-13 py-3.5 rounded-lg bg-primaria text-primaria-texto font-bold text-[15px] flex items-center justify-center"
        >
          Fazer novo pedido
        </Link>
      </div>
    </main>
  );
}
