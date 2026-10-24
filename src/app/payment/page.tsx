'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Loader2, MapPin, Zap } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { buscarHomeAtualizada, finalizarPedido } from '@/lib/api-cliente';
import { itensDoPedido, progressoMinimo } from '@/lib/carrinho';
import {
  armazemChavePedido,
  armazemCliente,
  armazemDetalhes,
  armazemEndereco,
  armazemUltimoPedido,
  freteVencido,
} from '@/lib/estado-checkout';
import { apenasDigitos, formatarPreco, linkWhatsapp } from '@/lib/formatacao';
import { recalcularFrete, useFrete } from '@/lib/frete';
import { usaPrecoCartao } from '@/lib/ofertas';
import { ERROS_DE_REDE, ErroPedido, MENSAGEM_ERRO_GENERICA, montarPayloadPedido, novaChave } from '@/lib/pedido';
import { subtotalCarrinho } from '@/lib/precoQuantidade';
import type { DadosHome, FormaPagamento, TotaisServidor } from '@/lib/tipos';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';
import { classeCampo } from '@/components/checkout/FormularioEndereco';
import { complementoDaLinha, OrderSummary, totaisDoPedido } from '@/components/checkout/OrderSummary';
import { PaymentOption } from '@/components/payment/PaymentOption';

function lerValor(texto: string): number | null {
  const n = parseFloat(texto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

interface ErroTela {
  texto: string;
  /** Falha de rede: o pedido pode ter chegado; "Tentar de novo" reenvia a mesma chave. */
  deRede: boolean;
}

export default function PaymentPage() {
  const router = useRouter();
  const hidratado = useHidratado();
  const { home: homeCache, status } = useCardapio();
  const { linhas, indisponiveis, limpar, atualizarPrecos, conferindoPrecos, precosMudaram } = useCart();
  const [cliente] = useArmazem(armazemCliente);
  const [endereco] = useArmazem(armazemEndereco);
  const freteSalvo = useFrete();
  const [detalhes, gravarDetalhes] = useArmazem(armazemDetalhes);
  const [homeAtual, setHomeAtual] = useState<DadosHome | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<ErroTela | null>(null);
  const [valoresNovos, setValoresNovos] = useState<TotaisServidor | null>(null);
  const enviandoRef = useRef(false);

  // Confere no banco (sem cache) se a loja continua aberta, as regras e os preços atuais.
  useEffect(() => {
    let ativo = true;
    buscarHomeAtualizada().then((h) => {
      if (ativo && h) setHomeAtual(h);
    });
    atualizarPrecos();
    return () => {
      ativo = false;
    };
  }, [atualizarPrecos]);

  const home = homeAtual ?? homeCache;
  const { config } = home;
  const aberta = homeAtual ? homeAtual.aberta : status.aberta;

  if (!hidratado) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout voltarPara="/checkout" etapa="Pagamento" />
      </main>
    );
  }

  if (linhas.length === 0) {
    return (
      <main className="min-h-[70vh] bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Pagamento" />
        <div className="text-center px-6 py-16">
          <p className="text-[17px] font-bold">Sua sacola está vazia</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-lg bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  const opcoes: { id: FormaPagamento; rotulo: string; descricao: string; icone: React.ReactNode }[] = [
    ...(config.aceita_pix
      ? [{ id: 'pix' as const, rotulo: 'Pix', descricao: 'Chave Pix na confirmação do pedido', icone: <Zap className="w-5 h-5 text-sucesso" /> }]
      : []),
    ...(config.aceita_dinheiro
      ? [{ id: 'dinheiro' as const, rotulo: 'Dinheiro', descricao: 'Pague na entrega', icone: <Banknote className="w-5 h-5 text-sucesso" /> }]
      : []),
    ...(config.aceita_cartao_entrega
      ? [{ id: 'cartao' as const, rotulo: 'Cartão', descricao: 'Crédito ou débito, na maquininha, na entrega', icone: <CreditCard className="w-5 h-5" /> }]
      : []),
  ];

  const pagamento = opcoes.some((o) => o.id === detalhes.pagamento) ? detalhes.pagamento : null;
  const frete = freteSalvo?.resultado ?? null;
  const cartao = usaPrecoCartao(pagamento);
  const subtotalPix = subtotalCarrinho(linhas, false);
  const subtotal = subtotalCarrinho(linhas, cartao);
  const { total } = totaisDoPedido(subtotal, frete?.frete ?? null, config.frete_gratis_acima);
  const minimo = progressoMinimo(subtotal, config.pedido_minimo);
  const troco = lerValor(detalhes.trocoPara);
  const dadosOk =
    cliente.nome.trim().length >= 2 &&
    apenasDigitos(cliente.telefone).length >= 10 &&
    endereco.rua.trim() !== '' &&
    endereco.numero.trim() !== '';

  const bloqueios = [
    !aberta && `A loja está fechada agora.${status.detalhe ? ` ${status.detalhe}.` : ''}`,
    !dadosOk && 'Faltam dados de contato ou endereço.',
    dadosOk && !frete && 'Confirme o endereço para calcular o frete.',
    frete?.bloqueado && 'Endereço fora da área de entrega.',
    !minimo.atingido && `Faltam ${formatarPreco(minimo.falta)} para o pedido mínimo de ${formatarPreco(config.pedido_minimo)}.`,
    !pagamento && 'Escolha a forma de pagamento.',
    pagamento === 'dinheiro' && troco != null && troco < total && 'O troco precisa ser para um valor maior que o total.',
  ].filter(Boolean) as string[];

  /** Envia o pedido. `totalConfirmado` = o cliente aceitou os valores novos do banco. */
  const finalizar = async (totalConfirmado?: number) => {
    if (bloqueios.length || !pagamento || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErro(null);

    // Mesma chave até o pedido ser aceito: reenvio depois de falha de rede não duplica.
    let chave = armazemChavePedido.ler();
    if (!chave) {
      chave = novaChave();
      armazemChavePedido.gravar(chave);
    }

    try {
      let totalEsperado = totalConfirmado ?? total;
      if (totalConfirmado == null && freteSalvo && freteVencido(freteSalvo)) {
        // frete salvo há mais de 30 min: recalcula antes de mandar o total esperado
        const novo = await recalcularFrete().catch(() => null);
        if (novo) totalEsperado = totaisDoPedido(subtotal, novo.resultado.frete, config.frete_gratis_acima).total;
      }

      const payload = montarPayloadPedido({
        cliente,
        endereco,
        itens: itensDoPedido(linhas),
        pagamento,
        trocoPara: troco,
        observacoes: detalhes.observacoes,
        chave,
        totalEsperado,
      });
      const resposta = await finalizarPedido(payload);
      armazemUltimoPedido.gravar({
        numero: resposta.numero,
        subtotal: resposta.subtotal,
        frete: resposta.frete,
        total: resposta.total,
        pagamento,
        trocoPara: payload.troco_para,
        nomeCliente: payload.cliente.nome,
        itens: linhas.map((l) => {
          const complemento = complementoDaLinha(l, cartao);
          return `${l.quantidade}× ${l.produto.nome}${complemento ? ` (${complemento})` : ''}`;
        }),
        endereco: [
          `${payload.endereco.rua}, ${payload.endereco.numero}`,
          payload.endereco.complemento,
          payload.endereco.bairro,
        ]
          .filter(Boolean)
          .join(' - '),
        repetido: resposta.repetido,
      });
      armazemChavePedido.gravar(null);
      gravarDetalhes((d) => ({ ...d, observacoes: '', trocoPara: '' }));
      limpar();
      router.replace('/confirmation');
    } catch (e) {
      if (e instanceof ErroPedido && e.codigo === 'PRECO_MUDOU' && e.totais) {
        // mostra os valores do banco e pede confirmação; atualiza preços e frete na tela
        setValoresNovos(e.totais);
        atualizarPrecos();
        recalcularFrete().catch(() => {});
      } else {
        setErro({
          texto: e instanceof ErroPedido ? e.message : MENSAGEM_ERRO_GENERICA,
          deRede: e instanceof ErroPedido ? ERROS_DE_REDE.includes(e.codigo) : true,
        });
        if (e instanceof ErroPedido && ['OFERTA_INDISPONIVEL', 'LOJA_FECHADA'].includes(e.codigo)) {
          atualizarPrecos();
          router.refresh();
        }
      }
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const whatsapp = linkWhatsapp(config.whatsapp || home.loja.telefone, 'Olá! Tentei fazer um pedido pelo cardápio online e a conexão caiu. Ele chegou?');
  const travado = bloqueios.length > 0 || enviando || conferindoPrecos;

  return (
    <main className="pb-10 bg-fundo min-h-screen">
      <CabecalhoCheckout voltarPara="/checkout" etapa="Etapa 2 de 2 · Pagamento" />

      <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[960px] mx-auto">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-black mb-3">Como você vai pagar?</h1>

          <section className="bg-white rounded-lg p-4 mb-3 shadow-cartao flex items-start gap-3">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0 text-[14px]">
              <p className="font-bold">
                {endereco.rua}, {endereco.numero}
                {endereco.complemento ? ` - ${endereco.complemento}` : ''}
              </p>
              <p className="text-suave">
                {[endereco.bairro, endereco.cidade].filter(Boolean).join(', ')} · {cliente.nome}
              </p>
            </div>
            <Link href="/checkout" className="text-[13px] font-bold underline py-1 shrink-0">
              Alterar
            </Link>
          </section>

          <div role="radiogroup" aria-label="Forma de pagamento" className="mb-2">
            {opcoes.map((o) => (
              <PaymentOption
                key={o.id}
                id={o.id}
                label={o.rotulo}
                descricao={o.descricao}
                icon={o.icone}
                isSelected={pagamento === o.id}
                onSelect={(id) => {
                  setValoresNovos(null); // outro pagamento = outro total
                  gravarDetalhes((d) => ({ ...d, pagamento: id as FormaPagamento }));
                }}
              />
            ))}
            {opcoes.length === 0 && (
              <p className="text-[14px] text-perigo">Nenhuma forma de pagamento disponível no momento.</p>
            )}
          </div>

          {cartao && subtotal !== subtotalPix && (
            <p className="rounded-lg bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[13px] mb-3" role="status">
              No cartão alguns itens têm outro preço: o subtotal passa de {formatarPreco(subtotalPix)} para{' '}
              <strong>{formatarPreco(subtotal)}</strong>.
            </p>
          )}

          {pagamento === 'dinheiro' && (
            <div className="bg-white rounded-lg p-4 mb-3 shadow-cartao">
              <label htmlFor="troco" className="block text-[14px] font-bold mb-1">
                Troco para quanto? <span className="font-normal text-suave text-[13px]">(deixe vazio se não precisar)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-suave text-[16px]">R$</span>
                <input
                  id="troco"
                  inputMode="decimal"
                  value={detalhes.trocoPara}
                  onChange={(e) => gravarDetalhes((d) => ({ ...d, trocoPara: e.target.value.replace(/[^\d.,]/g, '') }))}
                  placeholder="100,00"
                  className={`${classeCampo} pl-11`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-[320px] shrink-0">
          <div className="lg:sticky lg:top-20 space-y-3">
            {precosMudaram && !valoresNovos && (
              <p className="rounded-lg bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[13px]" role="status">
                Alguns preços da sua sacola foram atualizados. O resumo abaixo já mostra os valores atuais.
              </p>
            )}

            <OrderSummary forma={pagamento} freteBase={frete && !frete.bloqueado ? frete.frete : undefined} />

            {indisponiveis > 0 && (
              <p className="text-[13px] text-suave px-1">
                Itens que saíram do cardápio não entram no pedido.
              </p>
            )}

            {bloqueios.length > 0 && (
              <ul className="text-[13px] text-suave space-y-1 px-1" aria-label="O que falta">
                {bloqueios.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            )}

            {valoresNovos ? (
              <div className="rounded-lg bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[14px]" role="alert">
                <p className="font-bold">Os valores do pedido mudaram</p>
                <p className="text-[13px] mt-0.5">Confira os valores atuais antes de enviar:</p>
                <dl className="mt-2 space-y-0.5 tabular-nums">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{formatarPreco(valoresNovos.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Entrega</dt>
                    <dd>{valoresNovos.frete === 0 ? 'Grátis' : formatarPreco(valoresNovos.frete)}</dd>
                  </div>
                  <div className="flex justify-between font-black text-[16px] pt-1 mt-1 border-t border-[#F1D58A]">
                    <dt>Total</dt>
                    <dd>{formatarPreco(valoresNovos.total)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="mt-3 w-full h-12 rounded-lg bg-primaria text-primaria-texto text-[15px] font-black flex items-center justify-center gap-2 disabled:bg-[#DDD] disabled:text-suave"
                  disabled={bloqueios.length > 0 || enviando}
                  onClick={() => finalizar(valoresNovos.total)}
                >
                  {enviando && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                  {enviando ? 'Enviando pedido…' : `Confirmar pedido · ${formatarPreco(valoresNovos.total)}`}
                </button>
                <button
                  type="button"
                  className="mt-1 w-full h-10 text-[13px] font-bold underline"
                  onClick={() => setValoresNovos(null)}
                  disabled={enviando}
                >
                  Voltar e revisar
                </button>
              </div>
            ) : (
              <>
                {erro && (
                  <div className="rounded-lg bg-[#FFF1F1] border border-[#F5C2C2] p-3 text-[14px]" role="alert">
                    <p className="text-perigo font-medium">{erro.texto}</p>
                    {erro.deRede && (
                      <p className="text-[13px] text-tinta/80 mt-1">
                        Tentar de novo não duplica o pedido.
                        {whatsapp && (
                          <>
                            {' '}
                            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                              Confirme pelo WhatsApp
                            </a>
                            .
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="w-full h-14 rounded-lg bg-primaria text-primaria-texto text-[16px] font-black flex items-center justify-center gap-2 disabled:bg-[#DDD] disabled:text-suave"
                  disabled={travado}
                  onClick={() => finalizar()}
                >
                  {(enviando || conferindoPrecos) && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                  {enviando
                    ? 'Enviando pedido…'
                    : conferindoPrecos
                      ? 'Conferindo preços…'
                      : erro?.deRede
                        ? `Tentar de novo · ${formatarPreco(total)}`
                        : `Finalizar pedido · ${formatarPreco(total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
