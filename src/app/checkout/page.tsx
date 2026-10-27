'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { formatarNome, prontoParaConfirmar, validarDados, type ErrosDados } from '@/lib/etapasCheckout';
import { armazemCliente, armazemEndereco, armazemRetirada } from '@/lib/estado-checkout';
import { useFrete } from '@/lib/frete';
import { apenasDigitos, mascararTelefone } from '@/lib/formatacao';
import { registrarEtapa } from '@/lib/medicao';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';
import { BarraDaEtapa, Campo, classeCampo } from '@/components/checkout/campos';
import { LogoWhatsApp } from '@/components/checkout/LogosPagamento';

/**
 * Etapa 1 de 3: nome e WhatsApp, só isso. Quem já pediu antes (dados, endereço e frete
 * guardados no aparelho) vai direto para a confirmação; "?editar=1" volta aqui para mudar.
 */
function EtapaDados() {
  const router = useRouter();
  const editar = useSearchParams().get('editar') === '1';
  const hidratado = useHidratado();
  const { home, status } = useCardapio();
  const { linhas, atualizarPrecos } = useCart();
  const [cliente, gravarCliente] = useArmazem(armazemCliente);
  const [endereco] = useArmazem(armazemEndereco);
  const [retirada] = useArmazem(armazemRetirada);
  const frete = useFrete();
  const [erros, setErros] = useState<ErrosDados>({});
  const nomeRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);

  // A página pode estar com o catálogo em cache: confere os preços da sacola no banco.
  useEffect(() => {
    atualizarPrecos();
  }, [atualizarPrecos]);

  // conta só quem vê o formulário de dados (quem pula vai direto para a confirmação)
  const mostraDados = hidratado && linhas.length > 0;
  const pular = hidratado && !editar && linhas.length > 0 && prontoParaConfirmar(cliente, endereco, frete?.resultado ?? null, retirada);
  useEffect(() => {
    if (pular) router.replace('/payment?revisar=1');
    else if (mostraDados) registrarEtapa('dados');
  }, [pular, mostraDados, router]);

  if (!hidratado || pular) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Etapa 1 de 3" etapaAtual={1} />
      </main>
    );
  }

  if (linhas.length === 0) {
    return (
      <main className="min-h-[70vh] bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Etapa 1 de 3" etapaAtual={1} />
        <div className="text-center px-6 py-16">
          <p className="text-[18px] font-bold">Sua sacola está vazia</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-xl bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  // "editar" volta para a confirmação só se o endereço já está pronto; quem voltou da etapa 2
  // na primeira compra segue para o endereço (antes caía na confirmação sem endereço)
  const voltaParaConfirmar =
    editar && prontoParaConfirmar({ nome: 'ok', telefone: '21999999999' }, endereco, frete?.resultado ?? null, retirada);

  const continuar = () => {
    gravarCliente((c) => ({ ...c, nome: formatarNome(c.nome) }));
    const achados = validarDados(cliente);
    setErros(achados);
    if (achados.nome) return nomeRef.current?.focus();
    if (achados.telefone) return telefoneRef.current?.focus();
    router.push(voltaParaConfirmar ? '/payment?revisar=1' : '/checkout/endereco');
  };

  return (
    <main className="pb-32 bg-fundo min-h-screen">
      <CabecalhoCheckout voltarPara={voltaParaConfirmar ? '/payment?revisar=1' : '/'} etapa="Etapa 1 de 3" etapaAtual={1} />

      <form
        className="px-4 pt-5 max-w-[560px] mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          continuar();
        }}
        noValidate
      >
        <h1 className="text-[24px] font-black leading-tight mb-5">Para quem é o pedido?</h1>

        {!status.aberta && (
          <div className="mb-4 rounded-xl bg-aviso-claro p-3 text-[15px]">
            <strong className="text-aviso">{status.titulo}.</strong> {home.config.mensagem_fechado}
            {status.detalhe ? ` ${status.detalhe}.` : ''}
          </div>
        )}

        <div className="space-y-5">
          <Campo id="nome" rotulo="Nome" erro={erros.nome}>
            <input
              ref={nomeRef}
              id="nome"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              value={cliente.nome}
              onChange={(e) => {
                gravarCliente((c) => ({ ...c, nome: e.target.value }));
                if (erros.nome) setErros((x) => ({ ...x, nome: undefined }));
              }}
              // ao sair do campo: "maria DA silva" vira "Maria da Silva"
              onBlur={() => gravarCliente((c) => ({ ...c, nome: formatarNome(c.nome) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  telefoneRef.current?.focus();
                }
              }}
              aria-invalid={!!erros.nome}
              aria-describedby={erros.nome ? 'nome-erro' : undefined}
              className={classeCampo}
            />
          </Campo>
          <Campo
            id="telefone"
            rotulo={
              <span className="inline-flex items-center gap-1.5">
                <LogoWhatsApp className="w-[18px] h-[18px]" /> WhatsApp
              </span>
            }
            erro={erros.telefone}
            ajuda="Avisamos por aqui o andamento do pedido."
          >
            <input
              ref={telefoneRef}
              id="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              enterKeyHint="done"
              value={mascararTelefone(cliente.telefone)}
              onChange={(e) => {
                gravarCliente((c) => ({ ...c, telefone: apenasDigitos(e.target.value).slice(0, 11) }));
                if (erros.telefone) setErros((x) => ({ ...x, telefone: undefined }));
              }}
              placeholder="(21) 99999-9999"
              aria-invalid={!!erros.telefone}
              aria-describedby={erros.telefone ? 'telefone-erro' : undefined}
              className={classeCampo}
            />
          </Campo>
        </div>
        {/* Enter no teclado do celular envia o formulário */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Continuar
        </button>
      </form>

      <BarraDaEtapa rotulo={voltaParaConfirmar ? 'Salvar' : 'Continuar'} aoTocar={continuar} />
    </main>
  );
}

export default function CheckoutPage() {
  // useSearchParams pede Suspense no App Router
  return (
    <React.Suspense fallback={<main className="min-h-screen bg-fundo" />}>
      <EtapaDados />
    </React.Suspense>
  );
}
