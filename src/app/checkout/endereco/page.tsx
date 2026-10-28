'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bike, Loader2, LocateFixed, MapPin, Store } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem, useHidratado } from '@/lib/armazenamento';
import { buscarCep, calcularFrete, enderecoDoPonto, geocodificar } from '@/lib/api-cliente';
import { validarEndereco, type ErrosEndereco } from '@/lib/etapasCheckout';
import { armazemEndereco, armazemFrete, armazemRetirada, chaveEndereco } from '@/lib/estado-checkout';
import { useFrete } from '@/lib/frete';
import { apenasDigitos, formatarPreco, mascararCep } from '@/lib/formatacao';
import type { Endereco } from '@/lib/tipos';
import { registrarEtapa } from '@/lib/medicao';
import { CabecalhoCheckout } from '@/components/checkout/CabecalhoCheckout';
import { BarraDaEtapa, Campo, classeCampo } from '@/components/checkout/campos';

type EstadoBusca = 'ocioso' | 'buscando' | 'nao-achou' | 'negado' | 'erro';

const AVISO_GPS: Partial<Record<EstadoBusca, string>> = {
  negado: 'O celular não liberou a localização. Digite o CEP abaixo.',
  'nao-achou': 'Não achamos sua rua pela localização. Digite o CEP abaixo.',
  erro: 'Não deu para pegar a localização agora. Digite o CEP abaixo.',
};

/**
 * Etapa 2 de 3: endereço. "Usar minha localização" é opção, nunca o único caminho (muita
 * gente nega a permissão): o CEP fica logo embaixo e preenche rua e bairro. Cidade e UF não
 * aparecem (a entrega é no Rio). O GPS acerta a rua, mas erra o número: o número é sempre
 * digitado. O frete é calculado no "Continuar"; com o GPS, pelo ponto do GPS (mais exato).
 */
export default function EtapaEndereco() {
  const router = useRouter();
  const hidratado = useHidratado();
  const { linhas } = useCart();
  const { home } = useCardapio();
  const [retirada, gravarRetirada] = useArmazem(armazemRetirada);
  const [endereco, gravarEndereco] = useArmazem(armazemEndereco);
  const freteSalvo = useFrete();
  const [estadoCep, setEstadoCep] = useState<EstadoBusca>('ocioso');
  const [estadoGps, setEstadoGps] = useState<EstadoBusca>('ocioso');
  // ponto do GPS: o número digitado depois não apaga as coordenadas
  const [doGps, setDoGps] = useState(false);
  const [editandoRua, setEditandoRua] = useState(false);
  const [comReferencia, setComReferencia] = useState(false);
  const [erros, setErros] = useState<ErrosEndereco & { cep?: string }>({});
  const [calculando, setCalculando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const ruaRef = useRef<HTMLInputElement>(null);
  // CEP do campo agora: a resposta de um CEP digitado antes não pode sobrescrever o corrigido
  const cepDigitado = useRef('');

  // endereço guardado sem CEP (digitado à mão antes): mostra rua e bairro para conferir
  useEffect(() => {
    if (hidratado) registrarEtapa('endereco');
    if (hidratado && endereco.rua && !endereco.cep) setEditandoRua(true);
    if (hidratado && endereco.referencia) setComReferencia(true);
    // só ao abrir a etapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado]);

  if (!hidratado) {
    return (
      <main className="min-h-screen bg-fundo">
        <CabecalhoCheckout voltarPara="/checkout?editar=1" etapa="Etapa 2 de 3" etapaAtual={2} />
      </main>
    );
  }

  if (linhas.length === 0) {
    return (
      <main className="min-h-[70vh] bg-fundo">
        <CabecalhoCheckout voltarPara="/" etapa="Etapa 2 de 3" etapaAtual={2} />
        <div className="text-center px-6 py-16">
          <p className="text-[18px] font-bold">Sua sacola está vazia</p>
          <Link href="/" className="mt-4 inline-flex h-12 px-6 items-center rounded-xl bg-primaria text-primaria-texto font-bold">
            Ver o cardápio
          </Link>
        </div>
      </main>
    );
  }

  /** Rua, bairro ou CEP mudaram: a localização antiga não vale mais. */
  const mudarLocal = (campos: Partial<Endereco>) => {
    setDoGps(false);
    setAviso(null);
    gravarEndereco((a) => ({ ...a, ...campos, latitude: null, longitude: null }));
  };

  const aoMudarCep = async (valor: string) => {
    const cep = mascararCep(valor);
    cepDigitado.current = cep;
    mudarLocal({ cep });
    setErros((x) => ({ ...x, cep: undefined, rua: undefined }));
    if (apenasDigitos(cep).length !== 8) {
      setEstadoCep('ocioso');
      return;
    }
    setEstadoCep('buscando');
    try {
      const achado = await buscarCep(cep);
      if (cepDigitado.current !== cep) return; // a pessoa mudou o CEP enquanto buscava
      if (!achado || !achado.rua) {
        // CEP de cidade inteira ou inexistente: a pessoa digita a rua
        setEstadoCep('nao-achou');
        setEditandoRua(true);
        // a rua do CEP anterior não vale para este
        mudarLocal({ rua: '', ...(achado && { bairro: achado.bairro, cidade: achado.cidade || 'Rio de Janeiro', uf: achado.uf || 'RJ' }) });
        setTimeout(() => ruaRef.current?.focus(), 50);
        return;
      }
      setEstadoCep('ocioso');
      setEditandoRua(false);
      mudarLocal({ rua: achado.rua, bairro: achado.bairro, cidade: achado.cidade, uf: achado.uf });
      setTimeout(() => numeroRef.current?.focus(), 50);
    } catch {
      if (cepDigitado.current !== cep) return;
      setEstadoCep('erro');
      setEditandoRua(true);
    }
  };

  const usarLocalizacao = () => {
    if (!('geolocation' in navigator)) {
      setEstadoGps('erro');
      return;
    }
    setEstadoGps('buscando');
    setAviso(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const achado = await enderecoDoPonto(coords.latitude, coords.longitude);
        if (!achado) {
          setEstadoGps('nao-achou');
          return;
        }
        gravarEndereco((a) => ({
          ...a,
          cep: achado.cep,
          rua: achado.rua,
          bairro: achado.bairro || a.bairro,
          cidade: achado.cidade || 'Rio de Janeiro',
          uf: achado.uf || 'RJ',
          numero: '',
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        setDoGps(true);
        setEditandoRua(false);
        setEstadoGps('ocioso');
        setErros({});
        setTimeout(() => numeroRef.current?.focus(), 50);
      },
      (erro) => setEstadoGps(erro.code === erro.PERMISSION_DENIED ? 'negado' : 'erro'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  const continuar = async () => {
    if (calculando) return;
    if (retirada) {
      router.push('/payment');
      return;
    }
    const achados = validarEndereco(endereco);
    const semRua = achados.rua && !editandoRua;
    setErros(semRua ? { cep: 'Digite o CEP ou use a sua localização' } : achados);
    if (semRua) return cepRef.current?.focus();
    if (achados.rua) return ruaRef.current?.focus();
    if (achados.numero) return numeroRef.current?.focus();

    const alvo = armazemEndereco.ler();
    let resultado = freteSalvo?.resultado ?? null;
    if (!resultado) {
      setCalculando(true);
      setAviso(null);
      try {
        // com GPS, o frete sai do ponto do GPS; senão, do endereço achado no mapa
        const ponto =
          alvo.latitude != null && alvo.longitude != null ? { lat: alvo.latitude, lng: alvo.longitude } : await geocodificar(alvo);
        resultado = ponto ? await calcularFrete(ponto.lat, ponto.lng) : { distancia_km: null, frete: null, bloqueado: false };
        if (chaveEndereco(armazemEndereco.ler()) !== chaveEndereco(alvo)) return; // mexeu no meio
        gravarEndereco((a) => ({ ...a, latitude: ponto?.lat ?? null, longitude: ponto?.lng ?? null }));
        armazemFrete.gravar({ chave: chaveEndereco(alvo), resultado, calculadoEm: Date.now() });
      } catch {
        setAviso('Não conseguimos calcular a entrega agora. Confira sua internet e toque em Continuar de novo.');
        return;
      } finally {
        setCalculando(false);
      }
    }
    if (resultado.bloqueado) {
      setAviso(
        `Ainda não entregamos nesse endereço${
          resultado.distancia_km != null ? ` (fica a ${resultado.distancia_km.toLocaleString('pt-BR')} km da loja)` : ''
        }. Confira a rua e o número.`,
      );
      return;
    }
    router.push('/payment');
  };

  const ruaConhecida = endereco.rua.trim() !== '' && !editandoRua;
  const mostrarNumero = ruaConhecida || editandoRua;

  return (
    <main className="pb-32 bg-fundo min-h-screen">
      <CabecalhoCheckout voltarPara="/checkout?editar=1" etapa="Etapa 2 de 3" etapaAtual={2} />

      <form
        className="px-4 pt-5 max-w-[560px] mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          void continuar();
        }}
        noValidate
      >
        <h1 className="font-condensed text-[24px] font-bold uppercase tracking-[0.02em] leading-none mb-5">Como quer receber?</h1>
        {/* entrega ou retirada (26/10/2026): retirada não pede endereço nem cobra entrega */}
        <div role="radiogroup" aria-label="Como você quer receber" className="grid gap-2.5 mb-6">
          {[
            { valor: false, titulo: 'Receber em casa', detalhe: home.frete_minimo != null ? `Entrega a partir de ${formatarPreco(home.frete_minimo)}` : 'Entrega no seu endereço', icone: <Bike className="w-6 h-6" aria-hidden="true" /> },
            { valor: true, titulo: 'Retirar na loja', detalhe: `${home.loja.endereco ?? home.loja.bairro ?? 'Na loja'} · sem taxa`, icone: <Store className="w-6 h-6" aria-hidden="true" /> },
          ].map((o) => {
            const escolhido = retirada === o.valor;
            return (
              <button
                key={o.titulo}
                type="button"
                role="radio"
                aria-checked={escolhido}
                onClick={() => {
                  gravarRetirada(o.valor);
                  setAviso(null);
                  setErros({});
                }}
                className={`w-full min-h-16 text-left flex items-center gap-3.5 px-4 py-3 rounded-xl border ${
                  escolhido ? 'border-tinta bg-tinta text-white' : 'border-borda bg-white text-tinta'
                }`}
              >
                <span className="w-10 h-10 shrink-0 rounded-lg bg-white text-tinta flex items-center justify-center">{o.icone}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-bold leading-tight">{o.titulo}</span>
                  <span className={`block text-[13px] leading-snug mt-0.5 ${escolhido ? 'text-white/80' : 'text-suave'}`}>{o.detalhe}</span>
                </span>
                <span
                  className={`w-5 h-5 border-2 rounded-full shrink-0 flex items-center justify-center ${escolhido ? 'border-white' : 'border-controle'}`}
                  aria-hidden="true"
                >
                  {escolhido && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>

        {retirada ? (
          <div className="rounded-xl bg-white border border-borda p-4">
            <p className="text-[15px] font-bold">Retire na loja quando o pedido estiver pronto</p>
            <p className="text-[14px] text-suave mt-1">
              {[home.loja.endereco, home.loja.bairro].filter(Boolean).join(' · ')}. Depois de fazer o pedido, você acompanha o andamento por aqui.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-[18px] font-black mb-3">Onde entregamos?</h2>

        <button
          type="button"
          onClick={usarLocalizacao}
          disabled={estadoGps === 'buscando'}
          className="w-full h-14 rounded-xl border-2 border-tinta bg-white text-tinta text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          {estadoGps === 'buscando' ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="w-5 h-5" aria-hidden="true" />
          )}
          {estadoGps === 'buscando' ? 'Procurando sua rua…' : 'Usar minha localização'}
        </button>
        {AVISO_GPS[estadoGps] && (
          <p className="text-[14px] text-tinta mt-2 rounded-xl bg-aviso-claro border border-aviso-borda p-2.5" role="status">
            {AVISO_GPS[estadoGps]}
          </p>
        )}

        <p className="flex items-center gap-3 text-[14px] text-suave my-4">
          <span className="h-px flex-1 bg-borda" aria-hidden="true" />
          ou digite o CEP
          <span className="h-px flex-1 bg-borda" aria-hidden="true" />
        </p>

        <Campo
          id="cep"
          rotulo="CEP"
          erro={
            erros.cep ??
            (estadoCep === 'nao-achou'
              ? 'Esse CEP vale para várias ruas. Digite a sua abaixo.'
              : estadoCep === 'erro'
                ? 'Não deu para buscar o CEP agora. Digite a rua abaixo.'
                : null)
          }
        >
          <div className="relative">
            <input
              ref={cepRef}
              id="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={endereco.cep}
              onChange={(e) => void aoMudarCep(e.target.value)}
              placeholder="00000-000"
              aria-invalid={!!erros.cep || estadoCep === 'nao-achou'}
              aria-describedby={erros.cep || estadoCep === 'nao-achou' || estadoCep === 'erro' ? 'cep-erro' : undefined}
              className={classeCampo}
            />
            {estadoCep === 'buscando' && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-suave" aria-label="Buscando o CEP" />
            )}
          </div>
        </Campo>
        {!mostrarNumero && (
          <button
            type="button"
            onClick={() => {
              setEditandoRua(true);
              setTimeout(() => ruaRef.current?.focus(), 50);
            }}
            className="text-[15px] font-bold link-acao py-2 mt-1"
          >
            Não sei meu CEP
          </button>
        )}

        {ruaConhecida && (
          <div className="mt-4 rounded-xl bg-white border border-borda p-3.5 flex items-start gap-3">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-sucesso" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold leading-snug">{endereco.rua}</p>
              <p className="text-[14px] text-suave">{[endereco.bairro, endereco.cidade].filter(Boolean).join(' · ')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditandoRua(true);
                setTimeout(() => ruaRef.current?.focus(), 50);
              }}
              className="text-[14px] font-bold link-acao shrink-0 py-1"
            >
              Corrigir
            </button>
          </div>
        )}

        {editandoRua && (
          <div className="mt-4 space-y-4">
            <Campo id="rua" rotulo="Rua" erro={erros.rua}>
              <input
                ref={ruaRef}
                id="rua"
                autoComplete="address-line1"
                value={endereco.rua}
                onChange={(e) => {
                  mudarLocal({ rua: e.target.value });
                  if (erros.rua) setErros((x) => ({ ...x, rua: undefined }));
                }}
                aria-invalid={!!erros.rua}
                className={classeCampo}
              />
            </Campo>
            <Campo id="bairro" rotulo="Bairro">
              <input
                id="bairro"
                value={endereco.bairro}
                onChange={(e) => mudarLocal({ bairro: e.target.value })}
                className={classeCampo}
              />
            </Campo>
          </div>
        )}

        {mostrarNumero && (
          <>
            <div className="mt-4 grid grid-cols-[1fr_1.5fr] gap-3">
              <Campo id="numero" rotulo="Número" erro={erros.numero}>
                <input
                  ref={numeroRef}
                  id="numero"
                  inputMode="numeric"
                  value={endereco.numero}
                  onChange={(e) => {
                    const numero = e.target.value;
                    setAviso(null);
                    // com o ponto do GPS, o número não muda o lugar no mapa
                    gravarEndereco((a) => (doGps ? { ...a, numero } : { ...a, numero, latitude: null, longitude: null }));
                    if (erros.numero) setErros((x) => ({ ...x, numero: undefined }));
                  }}
                  aria-invalid={!!erros.numero}
                  aria-describedby={erros.numero ? 'numero-erro' : undefined}
                  className={classeCampo}
                />
              </Campo>
              <Campo id="complemento" rotulo="Complemento" opcional>
                <input
                  id="complemento"
                  autoComplete="address-line2"
                  value={endereco.complemento}
                  onChange={(e) => gravarEndereco((a) => ({ ...a, complemento: e.target.value }))}
                  placeholder="Casa 2, apto 301"
                  className={classeCampo}
                />
              </Campo>
            </div>
            {comReferencia ? (
              <Campo id="referencia" rotulo="Ponto de referência" opcional className="mt-4">
                <input
                  id="referencia"
                  value={endereco.referencia}
                  onChange={(e) => gravarEndereco((a) => ({ ...a, referencia: e.target.value }))}
                  placeholder="Perto da praça, portão azul"
                  className={classeCampo}
                />
              </Campo>
            ) : (
              <button type="button" onClick={() => setComReferencia(true)} className="text-[15px] font-bold link-acao py-2 mt-2">
                Adicionar ponto de referência
              </button>
            )}
          </>
        )}

          </>
        )}

        {aviso && (
          <p className="mt-4 rounded-xl bg-perigo-claro border border-perigo-borda p-3 text-[15px] text-perigo font-medium" role="alert">
            {aviso}
          </p>
        )}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Continuar
        </button>
      </form>

      <BarraDaEtapa rotulo="Continuar" aoTocar={() => void continuar()} carregando={calculando} rotuloCarregando="Calculando a entrega…" />
    </main>
  );
}
