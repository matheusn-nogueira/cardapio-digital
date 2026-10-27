'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { criarArmazem, useArmazem, useHidratado } from '@/lib/armazenamento';
import { formatarPreco } from '@/lib/formatacao';
import { descontoDoBloco, melhorBloco } from '@/lib/ofertas';
import { melhorPreco } from '@/lib/precoQuantidade';
import type { Produto } from '@/lib/tipos';
import { armazemIdade } from './ConfirmacaoIdade';
import { ImagemProduto } from './ImagemProduto';

// Dois pop-ups de promoção, no estilo do Zé, cada um no máximo uma vez por dia:
//  - "lista": os primeiros produtos da vitrine de categoria, 1,5 s depois de abrir a home;
//  - "oferta": o produto com o maior desconto no pack, quando a pessoa faz menção de sair
//    (mouse saindo pelo topo no computador; 45 s parada sem nada na sacola no celular).
type Tipo = 'lista' | 'oferta';
interface Vistas {
  lista: string | null;
  oferta: string | null;
}

const ATRASO_LISTA_MS = 1500;
const OCIOSO_OFERTA_MS = 45_000;
const ITENS_LISTA = 4;

const data = (v: unknown) => (typeof v === 'string' ? v : null);
const armazemPopup = criarArmazem<Vistas>(
  'cdf:popup',
  { lista: null, oferta: null },
  {
    validar: (b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      return { lista: data(o.lista), oferta: data(o.oferta) };
    },
  },
);

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** "Spaten Latão 473ml" com marca "Spaten" → ["Spaten", "Latão 473ml"]; sem marca, a primeira palavra. */
function partirNome(p: Produto): [string, string] {
  const marca = p.marca?.trim();
  if (marca && p.nome.toLowerCase().startsWith(marca.toLowerCase())) {
    return [marca, p.nome.slice(marca.length).replace(/^[\s-]+/, '')];
  }
  const [primeira, ...resto] = p.nome.split(/\s+/);
  return [primeira, resto.join(' ')];
}

export const PopupPromo: React.FC = () => {
  const { home, produtos, produtoPorId, abrirProduto } = useCardapio();
  const { quantidadeTotal } = useCart();
  const hidratado = useHidratado();
  const [vistas, gravarVistas] = useArmazem(armazemPopup);
  const [maiorDeIdade] = useArmazem(armazemIdade);
  const [aberto, setAberto] = useState<Tipo | null>(null);
  const abertoRef = useRef<Tipo | null>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);

  // só depois da hidratação e da confirmação de idade (o modal de idade fica por cima)
  const liberado = hidratado && (!home.config.pedir_confirmacao_idade || maiorDeIdade);
  // quem acabou de confirmar a idade não ganha outro pop-up em seguida (dois modais na chegada
  // fazem a pessoa sair): a lista fica para a próxima visita
  const idadeNaChegada = useRef<boolean | null>(null);
  const pedeIdade = home.config.pedir_confirmacao_idade;
  // roda antes dos efeitos dos pop-ups (mesma ordem da declaração)
  useEffect(() => {
    if (hidratado && idadeNaChegada.current === null) idadeNaChegada.current = !pedeIdade || maiorDeIdade;
  }, [hidratado, pedeIdade, maiorDeIdade]);
  const listaHoje = vistas.lista === hoje();
  const ofertaHoje = vistas.oferta === hoje();

  const lista = useMemo(() => {
    const vitrine = home.vitrines.find((v) => v.tipo === 'categoria' && v.categoria_id) ?? home.vitrines[0];
    if (!vitrine) return null;
    const itens = vitrine.produtos.map((id) => produtoPorId.get(id)).filter((p): p is Produto => !!p).slice(0, ITENS_LISTA);
    if (itens.length < 2) return null;
    const categoria = home.categorias.find((c) => c.id === vitrine.categoria_id);
    return {
      titulo: categoria?.nome ?? vitrine.titulo,
      href: categoria ? `/categoria/${categoria.id}` : '/',
      itens,
    };
  }, [home.vitrines, home.categorias, produtoPorId]);

  const oferta = useMemo(() => {
    let melhor: { produto: Produto; desconto: number } | null = null;
    for (const p of produtos) {
      const bloco = melhorBloco(p.ofertas);
      if (!bloco) continue;
      const desconto = descontoDoBloco(bloco, melhorPreco(p, 1, false).total);
      if (desconto > 0 && (!melhor || desconto > melhor.desconto)) melhor = { produto: p, desconto };
    }
    return melhor;
  }, [produtos]);

  const abrir = useCallback(
    (tipo: Tipo) => {
      if (abertoRef.current) return;
      abertoRef.current = tipo;
      setAberto(tipo);
      gravarVistas((v) => ({ ...v, [tipo]: hoje() }));
    },
    [gravarVistas],
  );
  const fechar = useCallback(() => {
    abertoRef.current = null;
    setAberto(null);
  }, []);

  useEffect(() => {
    if (!liberado || listaHoje || !lista || !idadeNaChegada.current) return;
    const relogio = setTimeout(() => abrir('lista'), ATRASO_LISTA_MS);
    return () => clearTimeout(relogio);
  }, [liberado, listaHoje, lista, abrir]);

  useEffect(() => {
    if (!liberado || ofertaHoje || !oferta) return;
    const aoSair = (e: MouseEvent) => {
      if (e.clientY <= 0) abrir('oferta');
    };
    // parada de verdade: o relógio volta a zero a cada rolagem ou toque (antes contava desde a
    // abertura e o pop-up interrompia quem estava olhando o cardápio)
    let ocioso = 0;
    const armar = () => {
      window.clearTimeout(ocioso);
      ocioso = window.setTimeout(() => {
        if (quantidadeTotal === 0) abrir('oferta');
      }, OCIOSO_OFERTA_MS);
    };
    const MEXEU = ['scroll', 'touchstart', 'pointerdown', 'keydown'] as const;
    armar();
    MEXEU.forEach((ev) => window.addEventListener(ev, armar, { passive: true }));
    document.addEventListener('mouseleave', aoSair);
    return () => {
      document.removeEventListener('mouseleave', aoSair);
      MEXEU.forEach((ev) => window.removeEventListener(ev, armar));
      window.clearTimeout(ocioso);
    };
  }, [liberado, ofertaHoje, oferta, quantidadeTotal, abrir]);

  useEffect(() => {
    if (!aberto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  const botaoX = (
    <button
      ref={botaoFechar}
      type="button"
      onClick={fechar}
      aria-label="Fechar"
      className="absolute right-3 top-3 z-20 w-10 h-10 rounded-lg bg-[#333333] text-primaria flex items-center justify-center shadow-md"
    >
      <X className="w-6 h-6" strokeWidth={3} aria-hidden="true" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={fechar} aria-hidden="true" />

      {aberto === 'lista' && lista && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-popup"
          className="relative w-full max-w-[380px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl bg-primaria shadow-xl animate-sobe"
        >
          {botaoX}
          <div className="bg-white px-6 pt-7 pb-9 text-center [clip-path:polygon(0_0,100%_0,100%_78%,0_100%)]">
            <h2 id="titulo-popup" className="font-condensed font-bold uppercase text-[42px] leading-[0.95] text-tinta tracking-tight">
              {lista.titulo}
            </h2>
            <p className="font-condensed italic uppercase text-[26px] leading-none text-tinta mt-1">no precinho</p>
          </div>

          <ul className="px-4 pt-1 pb-3 space-y-3">
            {lista.itens.map((p, i) => {
              const [marca, resto] = partirNome(p);
              const invertido = i % 2 === 1;
              return (
                <li key={p.id} className={`flex items-center gap-2 ${invertido ? 'flex-row-reverse' : ''}`}>
                  <div className="w-[104px] h-[104px] bg-white rounded-xl p-2 shrink-0">
                    <ImagemProduto produto={p} />
                  </div>
                  <div
                    // o selo invade só a foto, nunca o nome
                    className={`relative z-10 shrink-0 w-[88px] h-[88px] rounded-full bg-tinta text-primaria flex flex-col items-center justify-center ${
                      invertido ? '-mr-4 rotate-6' : '-ml-4 -rotate-6'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide">por apenas</span>
                    <span className="font-condensed font-bold text-[22px] leading-none mt-0.5">{formatarPreco(melhorPreco(p, 1, false).total)}</span>
                  </div>
                  <div className={`flex-1 min-w-0 font-condensed uppercase text-tinta leading-[0.95] ${invertido ? 'text-right' : ''}`}>
                    <span className="block font-bold text-[24px] line-clamp-1">{marca}</span>
                    {resto && <span className="block italic text-[18px] line-clamp-2">{resto}</span>}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="px-5 pb-5">
            <Link
              href={lista.href}
              onClick={fechar}
              className="flex items-center justify-center w-full h-14 rounded-xl bg-tinta text-white font-condensed font-bold uppercase text-[22px]"
            >
              Ver {lista.titulo.toLowerCase()}
            </Link>
            <p className="text-[10px] text-tinta/70 text-center mt-2">Preços do delivery, enquanto durar o estoque.</p>
          </div>
        </div>
      )}

      {aberto === 'oferta' && oferta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-popup"
          className="relative w-full max-w-[380px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl bg-primaria shadow-xl animate-sobe"
        >
          {botaoX}
          <div className="relative bg-tinta px-6 pt-12 pb-28 text-center [clip-path:polygon(0_0,100%_0,100%_72%,0_100%)]">
            <span
              className="absolute left-4 top-4 w-14 h-14 rounded-full bg-primaria text-tinta font-black text-[28px] flex items-center justify-center -rotate-12"
              aria-hidden="true"
            >
              %
            </span>
            <h2 id="titulo-popup" className="font-condensed font-bold italic uppercase text-white text-[46px] leading-[0.92] tracking-tight">
              Oferta
              <br />
              especial
            </h2>
            <p className="font-condensed italic uppercase text-primaria text-[30px] leading-none mt-1">pra você</p>
          </div>

          <div className="relative -mt-24 px-6">
            <div className="bg-white rounded-xl p-4 h-[200px]">
              <ImagemProduto produto={oferta.produto} tamanho="grande" />
            </div>
          </div>

          <div className="px-6 pt-4 pb-6 text-center text-tinta">
            <p className="font-condensed font-bold italic text-[20px] leading-tight line-clamp-2">{oferta.produto.nome}</p>
            <p className="font-condensed font-bold text-[46px] leading-none mt-2 tabular-nums">
              {formatarPreco(melhorPreco(oferta.produto, 1, false).total)}
            </p>
            {(() => {
              const bloco = melhorBloco(oferta.produto.ofertas);
              // a promoção dita como no mercado ("12 por R$ 44,00"), sem o preço quebrado por unidade
              return bloco ? (
                <p className="text-[13px] font-bold mt-1.5 tabular-nums">
                  {bloco.qtd} por {formatarPreco(bloco.preco)} · -{oferta.desconto}%
                </p>
              ) : null;
            })()}
            <p className="text-[10px] italic mt-1 text-tinta/70">Preço do delivery, enquanto durar o estoque.</p>
            <button
              type="button"
              onClick={() => {
                fechar();
                abrirProduto(oferta.produto.id);
              }}
              className="mt-4 w-full h-14 rounded-xl bg-tinta text-white font-condensed font-bold uppercase text-[22px]"
            >
              Ver oferta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
