'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { progressoMinimo } from '@/lib/carrinho';
import { armazemCliente, armazemDetalhes, armazemEndereco } from '@/lib/estado-checkout';
import { useFrete } from '@/lib/frete';
import { apenasDigitos, formatarPreco, mascararTelefone } from '@/lib/formatacao';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';
import { Campo, classeCampo, FormularioEndereco } from '@/components/checkout/FormularioEndereco';
import { InstructionsCard } from '@/components/checkout/InstructionsCard';
import { OrderSummary } from '@/components/checkout/OrderSummary';

export default function CheckoutPage() {
  const router = useRouter();
  const hidratado = useHidratado();
  const { home, status } = useCardapio();
  const { linhas, subtotal, abrirSacola, atualizarPrecos, precosMudaram } = useCart();
  const [cliente, gravarCliente] = useArmazem(armazemCliente);
  const [endereco] = useArmazem(armazemEndereco);
  const freteSalvo = useFrete();
  const [detalhes, gravarDetalhes] = useArmazem(armazemDetalhes);

  // A página pode estar com o catálogo em cache: confere os preços da sacola no banco.
  useEffect(() => {
    atualizarPrecos();
  }, [atualizarPrecos]);

  if (!hidratado) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Entrega" />
      </main>
    );
  }

  if (linhas.length === 0) {
    return (
      <main className="min-h-[70vh] bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Entrega" />
        <div className="text-center px-6 py-16">
          <p className="text-[17px] font-bold">Sua sacola está vazia</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-lg bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  const frete = freteSalvo?.resultado ?? null;
  const minimo = progressoMinimo(subtotal, home.config.pedido_minimo);
  const nomeOk = cliente.nome.trim().length >= 2;
  const telefoneOk = apenasDigitos(cliente.telefone).length >= 10;

  const pendencias = [
    !nomeOk && 'Informe seu nome',
    !telefoneOk && 'Informe um WhatsApp com DDD',
    (!endereco.rua.trim() || !endereco.numero.trim()) && 'Preencha rua e número',
    endereco.rua.trim() && endereco.numero.trim() && !frete && 'Confirme o endereço para calcular o frete',
    frete?.bloqueado && 'Endereço fora da área de entrega',
    !minimo.atingido && `Faltam ${formatarPreco(minimo.falta)} para o pedido mínimo`,
  ].filter(Boolean) as string[];

  return (
    <main className="pb-10 bg-fundo min-h-screen">
      <CabecalhoCheckout voltarPara="/" etapa="Etapa 1 de 2 · Entrega" />

      <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[960px] mx-auto">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-black mb-3">Para onde vamos levar?</h1>

          {!status.aberta && (
            <div className="mb-3 rounded-lg bg-[#FFF1F1] border border-[#F5C2C2] p-3 text-[14px]">
              <strong className="text-perigo">{status.titulo}.</strong> {home.config.mensagem_fechado}
              {status.detalhe ? ` ${status.detalhe}.` : ''}
            </div>
          )}

          {precosMudaram && (
            <p className="mb-3 rounded-lg bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[14px]" role="status">
              Alguns preços da sua sacola foram atualizados. Confira o resumo do pedido.
            </p>
          )}

          <section className="bg-white rounded-lg p-4 mb-3 shadow-cartao" aria-labelledby="titulo-dados">
            <h2 id="titulo-dados" className="text-[14px] font-medium uppercase tracking-wide text-rotulo mb-3 flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" /> Seus dados
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo id="nome" rotulo="Nome">
                <input
                  id="nome"
                  autoComplete="name"
                  value={cliente.nome}
                  onChange={(e) => gravarCliente((c) => ({ ...c, nome: e.target.value }))}
                  className={classeCampo}
                />
              </Campo>
              <Campo id="telefone" rotulo="WhatsApp">
                <input
                  id="telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={mascararTelefone(cliente.telefone)}
                  onChange={(e) => gravarCliente((c) => ({ ...c, telefone: apenasDigitos(e.target.value).slice(0, 11) }))}
                  placeholder="(21) 99999-9999"
                  className={classeCampo}
                />
              </Campo>
            </div>
          </section>

          <FormularioEndereco />

          <InstructionsCard
            valor={detalhes.observacoes}
            aoMudar={(observacoes) => gravarDetalhes((d) => ({ ...d, observacoes }))}
          />

          <button
            type="button"
            onClick={abrirSacola}
            className="text-[14px] font-bold underline py-2 mb-1"
          >
            Editar itens da sacola
          </button>
        </div>

        <div className="lg:w-[320px] shrink-0">
          <div className="lg:sticky lg:top-20 space-y-3">
            <OrderSummary forma={null} freteBase={frete ? (frete.bloqueado ? undefined : frete.frete) : undefined} />

            {pendencias.length > 0 && (
              <ul className="text-[13px] text-suave space-y-1 px-1" aria-label="O que falta">
                {pendencias.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="w-full h-13 py-3.5 rounded-lg bg-primaria text-primaria-texto text-[15px] font-bold disabled:bg-[#DDD] disabled:text-suave"
              disabled={pendencias.length > 0}
              onClick={() => router.push('/payment')}
            >
              Ir para pagamento
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
