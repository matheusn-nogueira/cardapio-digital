'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Loader2, MapPin, Zap } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { buscarHomeAtualizada, finalizarPedido } from '@/lib/api-cliente';
import { calcularSubtotal, progressoMinimo } from '@/lib/carrinho';
import {
  armazemCliente,
  armazemDetalhes,
  armazemEndereco,
  armazemFrete,
  armazemUltimoPedido,
  chaveEndereco,
} from '@/lib/estado-checkout';
import { apenasDigitos, formatarPreco } from '@/lib/formatacao';
import { rotuloOferta } from '@/lib/ofertas';
import { ErroPedido, MENSAGEM_ERRO_GENERICA, montarPayloadPedido } from '@/lib/pedido';
import type { DadosHome, FormaPagamento } from '@/lib/tipos';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';
import { classeCampo } from '@/components/checkout/FormularioEndereco';
import { OrderSummary, totaisDoPedido } from '@/components/checkout/OrderSummary';
import { PaymentOption } from '@/components/payment/PaymentOption';

function lerValor(texto: string): number | null {
  const n = parseFloat(texto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export default function PaymentPage() {
  const router = useRouter();
  const hidratado = useHidratado();
  const { home: homeCache, status } = useCardapio();
  const { linhas, indisponiveis, itens, limpar } = useCart();
  const [cliente] = useArmazem(armazemCliente);
  const [endereco] = useArmazem(armazemEndereco);
  const [freteSalvo] = useArmazem(armazemFrete);
  const [detalhes, gravarDetalhes] = useArmazem(armazemDetalhes);
  const [homeAtual, setHomeAtual] = useState<DadosHome | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviandoRef = useRef(false);

  // Confere no banco (sem cache) se a loja continua aberta e as regras atuais.
  useEffect(() => {
    let ativo = true;
    buscarHomeAtualizada().then((h) => {
      if (ativo && h) setHomeAtual(h);
    });
    return () => {
      ativo = false;
    };
  }, []);

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
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-xl bg-primaria text-primaria-texto font-bold">
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
      ? [
          { id: 'credito' as const, rotulo: 'Cartão de crédito', descricao: 'Na maquininha, na entrega', icone: <CreditCard className="w-5 h-5" /> },
          { id: 'debito' as const, rotulo: 'Cartão de débito', descricao: 'Na maquininha, na entrega', icone: <CreditCard className="w-5 h-5" /> },
        ]
      : []),
  ];

  const pagamento = opcoes.some((o) => o.id === detalhes.pagamento) ? detalhes.pagamento : null;
  const frete = freteSalvo && freteSalvo.chave === chaveEndereco(endereco) ? freteSalvo.resultado : null;
  const subtotalPix = calcularSubtotal(linhas, 'pix');
  const subtotal = calcularSubtotal(linhas, pagamento);
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

  const finalizar = async () => {
    if (bloqueios.length || !pagamento || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErro(null);
    try {
      const payload = montarPayloadPedido({
        cliente,
        endereco,
        itens: itens.filter((i) => linhas.some((l) => l.oferta.id === i.ofertaId)),
        pagamento,
        trocoPara: troco,
        observacoes: detalhes.observacoes,
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
        itens: linhas.map(({ item, produto, oferta }) => {
          const rotulo = rotuloOferta(oferta, produto);
          return `${item.quantidade}× ${produto.nome}${rotulo !== 'Unidade' ? ` (${rotulo})` : ''}${oferta.quente ? ' natural' : ''}`;
        }),
        endereco: [
          `${payload.endereco.rua}, ${payload.endereco.numero}`,
          payload.endereco.complemento,
          payload.endereco.bairro,
        ]
          .filter(Boolean)
          .join(' - '),
      });
      gravarDetalhes((d) => ({ ...d, observacoes: '', trocoPara: '' }));
      limpar();
      router.replace('/confirmation');
    } catch (e) {
      setErro(e instanceof ErroPedido ? e.message : MENSAGEM_ERRO_GENERICA);
      if (e instanceof ErroPedido && ['OFERTA_INDISPONIVEL', 'LOJA_FECHADA'].includes(e.codigo)) router.refresh();
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  return (
    <main className="pb-10 bg-fundo min-h-screen">
      <CabecalhoCheckout voltarPara="/checkout" etapa="Etapa 2 de 2 · Pagamento" />

      <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[960px] mx-auto">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-black mb-3">Como você vai pagar?</h1>

          <section className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-start gap-3">
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
                onSelect={(id) => gravarDetalhes((d) => ({ ...d, pagamento: id as FormaPagamento }))}
              />
            ))}
            {opcoes.length === 0 && (
              <p className="text-[14px] text-perigo">Nenhuma forma de pagamento disponível no momento.</p>
            )}
          </div>

          {(pagamento === 'credito' || pagamento === 'debito') && subtotal !== subtotalPix && (
            <p className="rounded-xl bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[13px] mb-3" role="status">
              No cartão alguns itens têm outro preço: o subtotal passa de {formatarPreco(subtotalPix)} para{' '}
              <strong>{formatarPreco(subtotal)}</strong>.
            </p>
          )}

          {pagamento === 'dinheiro' && (
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
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
            <OrderSummary forma={pagamento} freteBase={frete && !frete.bloqueado ? frete.frete : undefined} />

            {indisponiveis.length > 0 && (
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

            {erro && (
              <p className="rounded-xl bg-[#FFF1F1] border border-[#F5C2C2] p-3 text-[14px] text-perigo font-medium" role="alert">
                {erro}
              </p>
            )}

            <button
              type="button"
              className="w-full h-14 rounded-xl bg-primaria text-primaria-texto text-[16px] font-black flex items-center justify-center gap-2 disabled:bg-[#DDD] disabled:text-suave"
              disabled={bloqueios.length > 0 || enviando}
              onClick={finalizar}
            >
              {enviando && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              {enviando ? 'Enviando pedido…' : `Finalizar pedido · ${formatarPreco(total)}`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
