'use client';

import React, { useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useCardapio } from '@/context/CardapioContext';
import { useCart } from '@/context/CartContext';
import { useArmazem } from '@/lib/armazenamento';
import { buscarCep, calcularFrete, geocodificar } from '@/lib/api-cliente';
import { freteFinal } from '@/lib/carrinho';
import { armazemEndereco, armazemFrete, chaveEndereco } from '@/lib/estado-checkout';
import { apenasDigitos, formatarPreco, mascararCep } from '@/lib/formatacao';
import type { Endereco } from '@/lib/tipos';

export const classeCampo =
  'w-full h-12 px-3.5 border border-borda rounded-xl text-[16px] text-tinta bg-white outline-none focus:border-tinta aria-[invalid=true]:border-perigo';

export const Campo: React.FC<{
  id: string;
  rotulo: string;
  opcional?: boolean;
  erro?: string | null;
  children: React.ReactNode;
  className?: string;
}> = ({ id, rotulo, opcional, erro, children, className }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-[13px] font-medium text-tinta mb-1">
      {rotulo} {opcional && <span className="text-suave font-normal">(opcional)</span>}
    </label>
    {children}
    {erro && (
      <p id={`${id}-erro`} className="text-[12px] text-perigo mt-1">
        {erro}
      </p>
    )}
  </div>
);

type EstadoCep = 'ocioso' | 'buscando' | 'nao-encontrado' | 'erro';

/** Endereço de entrega: CEP → ViaCEP, geocodificação (Nominatim) e frete pelo banco. */
export const FormularioEndereco: React.FC = () => {
  const { home } = useCardapio();
  const { subtotal } = useCart();
  const [endereco, gravarEndereco] = useArmazem(armazemEndereco);
  const [freteSalvo, gravarFrete] = useArmazem(armazemFrete);
  const [estadoCep, setEstadoCep] = useState<EstadoCep>('ocioso');
  const [calculando, setCalculando] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  const freteValido = freteSalvo && freteSalvo.chave === chaveEndereco(endereco) ? freteSalvo.resultado : null;
  const podeCalcular = endereco.rua.trim() !== '' && endereco.numero.trim() !== '';

  // Qualquer mudança no endereço invalida a localização (e o frete, pela chave).
  const mudar = (campos: Partial<Endereco>) =>
    gravarEndereco((atual) => ({ ...atual, ...campos, latitude: null, longitude: null }));

  const aoMudarCep = async (valor: string) => {
    const cep = mascararCep(valor);
    mudar({ cep });
    if (apenasDigitos(cep).length !== 8) {
      setEstadoCep('ocioso');
      return;
    }
    setEstadoCep('buscando');
    try {
      const achado = await buscarCep(cep);
      if (!achado) {
        setEstadoCep('nao-encontrado');
        return;
      }
      setEstadoCep('ocioso');
      gravarEndereco((atual) => ({
        ...atual,
        rua: achado.rua || atual.rua,
        bairro: achado.bairro || atual.bairro,
        cidade: achado.cidade || atual.cidade,
        uf: achado.uf || atual.uf,
        latitude: null,
        longitude: null,
      }));
    } catch {
      setEstadoCep('erro');
    }
  };

  const aoCalcularFrete = async () => {
    if (!podeCalcular || calculando) return;
    setCalculando(true);
    setErroFrete(null);
    const alvo = armazemEndereco.ler();
    try {
      const ponto = await geocodificar(alvo);
      const resultado = ponto
        ? await calcularFrete(ponto.lat, ponto.lng)
        : { distancia_km: null, frete: null, bloqueado: false };
      gravarEndereco((atual) => ({ ...atual, latitude: ponto?.lat ?? null, longitude: ponto?.lng ?? null }));
      gravarFrete({ chave: chaveEndereco(alvo), resultado });
    } catch {
      setErroFrete('Não conseguimos calcular o frete agora. Confira sua internet e tente de novo.');
    } finally {
      setCalculando(false);
    }
  };

  const valorFrete = freteValido ? freteFinal(freteValido.frete, subtotal, home.config.frete_gratis_acima) : null;

  return (
    <section className="bg-white rounded-2xl p-4 mb-3 shadow-sm" aria-labelledby="titulo-endereco">
      <h2 id="titulo-endereco" className="text-[15px] font-bold mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5" aria-hidden="true" /> Endereço de entrega
      </h2>

      <div className="grid grid-cols-6 gap-3">
        <Campo
          id="cep"
          rotulo="CEP"
          className="col-span-6 sm:col-span-3"
          erro={
            estadoCep === 'nao-encontrado'
              ? 'CEP não encontrado. Preencha a rua manualmente.'
              : estadoCep === 'erro'
                ? 'Não deu para buscar o CEP agora. Preencha a rua manualmente.'
                : null
          }
        >
          <div className="relative">
            <input
              id="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={endereco.cep}
              onChange={(e) => aoMudarCep(e.target.value)}
              placeholder="00000-000"
              className={classeCampo}
              aria-invalid={estadoCep === 'nao-encontrado'}
              aria-describedby={estadoCep === 'nao-encontrado' || estadoCep === 'erro' ? 'cep-erro' : undefined}
            />
            {estadoCep === 'buscando' && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-suave" aria-label="Buscando CEP" />
            )}
          </div>
        </Campo>

        <Campo id="rua" rotulo="Rua" className="col-span-6">
          <input
            id="rua"
            autoComplete="address-line1"
            value={endereco.rua}
            onChange={(e) => mudar({ rua: e.target.value })}
            className={classeCampo}
          />
        </Campo>

        <Campo id="numero" rotulo="Número" className="col-span-2">
          <input
            id="numero"
            inputMode="numeric"
            value={endereco.numero}
            onChange={(e) => mudar({ numero: e.target.value })}
            className={classeCampo}
          />
        </Campo>

        <Campo id="complemento" rotulo="Complemento" opcional className="col-span-4">
          <input
            id="complemento"
            autoComplete="address-line2"
            value={endereco.complemento}
            onChange={(e) => gravarEndereco((a) => ({ ...a, complemento: e.target.value }))}
            placeholder="Casa 2, apto 301…"
            className={classeCampo}
          />
        </Campo>

        <Campo id="bairro" rotulo="Bairro" className="col-span-6 sm:col-span-3">
          <input
            id="bairro"
            value={endereco.bairro}
            onChange={(e) => mudar({ bairro: e.target.value })}
            className={classeCampo}
          />
        </Campo>

        <Campo id="cidade" rotulo="Cidade" className="col-span-4 sm:col-span-2">
          <input
            id="cidade"
            autoComplete="address-level2"
            value={endereco.cidade}
            onChange={(e) => mudar({ cidade: e.target.value })}
            className={classeCampo}
          />
        </Campo>

        <Campo id="uf" rotulo="UF" className="col-span-2 sm:col-span-1">
          <input
            id="uf"
            maxLength={2}
            autoComplete="address-level1"
            value={endereco.uf}
            onChange={(e) => mudar({ uf: e.target.value.toUpperCase() })}
            className={classeCampo}
          />
        </Campo>

        <Campo id="referencia" rotulo="Ponto de referência" opcional className="col-span-6">
          <input
            id="referencia"
            value={endereco.referencia}
            onChange={(e) => gravarEndereco((a) => ({ ...a, referencia: e.target.value }))}
            placeholder="Perto da praça, portão azul…"
            className={classeCampo}
          />
        </Campo>
      </div>

      <div className="mt-4" aria-live="polite">
        {freteValido ? (
          freteValido.bloqueado ? (
            <p className="rounded-xl bg-[#FFF1F1] border border-[#F5C2C2] p-3 text-[14px] text-perigo font-medium">
              Infelizmente não entregamos nesse endereço
              {freteValido.distancia_km != null ? ` (${freteValido.distancia_km.toLocaleString('pt-BR')} km da loja)` : ''}.
            </p>
          ) : freteValido.frete == null ? (
            <p className="rounded-xl bg-[#FFF8E1] border border-[#F1D58A] p-3 text-[14px]">
              Não achamos esse endereço no mapa. Você pode seguir: a loja confirma o frete com você antes da entrega.
            </p>
          ) : (
            <p className="rounded-xl bg-[#E7F6EC] border border-[#B7E1C4] p-3 text-[14px] text-sucesso font-medium">
              Entregamos aí! Frete: {valorFrete === 0 ? 'grátis' : formatarPreco(valorFrete ?? 0)}
              {freteValido.distancia_km != null && (
                <span className="font-normal text-tinta/70"> · {freteValido.distancia_km.toLocaleString('pt-BR')} km</span>
              )}
            </p>
          )
        ) : (
          <button
            type="button"
            onClick={aoCalcularFrete}
            disabled={!podeCalcular || calculando}
            className="w-full h-12 rounded-xl border-2 border-tinta text-tinta font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {calculando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {calculando ? 'Calculando frete…' : podeCalcular ? 'Confirmar endereço e calcular frete' : 'Preencha rua e número'}
          </button>
        )}
        {erroFrete && <p className="text-[13px] text-perigo mt-2">{erroFrete}</p>}
      </div>
    </section>
  );
};
