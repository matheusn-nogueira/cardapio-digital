'use client';

// Frete do endereço salvo, com validade: passou de 30 min, recalcula pelas
// coordenadas já encontradas (sem geocodificar de novo).
import { useEffect } from 'react';
import { calcularFrete } from './api-cliente';
import { useArmazem } from './armazenamento';
import {
  armazemEndereco,
  armazemFrete,
  chaveEndereco,
  FreteSalvo,
  VALIDADE_FRETE_MS,
} from './estado-checkout';
import type { ResultadoFrete } from './tipos';

/**
 * Recalcula e grava o frete do endereço atual. Sem coordenadas (endereço não achado
 * no mapa) o frete continua "a confirmar" e só renova a validade.
 * Lança erro se o banco não responder (o valor antigo continua salvo).
 */
export async function recalcularFrete(): Promise<FreteSalvo> {
  const endereco = armazemEndereco.ler();
  const chave = chaveEndereco(endereco);
  const { latitude, longitude } = endereco;
  const resultado: ResultadoFrete =
    latitude != null && longitude != null
      ? await calcularFrete(latitude, longitude)
      : { distancia_km: null, frete: null, bloqueado: false };
  const novo: FreteSalvo = { chave, resultado, calculadoEm: Date.now() };
  // o endereço pode ter mudado enquanto calculava: só grava se ainda for o mesmo
  if (chaveEndereco(armazemEndereco.ler()) === chave) armazemFrete.gravar(novo);
  return novo;
}

/** Frete salvo que vale para o endereço atual (null = ainda não calculado). Renova sozinho ao vencer. */
export function useFrete(): FreteSalvo | null {
  const [endereco] = useArmazem(armazemEndereco);
  const [salvo] = useArmazem(armazemFrete);
  const valido = salvo && salvo.chave === chaveEndereco(endereco) ? salvo : null;
  const calculadoEm = valido?.calculadoEm ?? null;

  useEffect(() => {
    if (calculadoEm == null) return;
    const falta = calculadoEm + VALIDADE_FRETE_MS - Date.now();
    const relogio = setTimeout(
      () => {
        recalcularFrete().catch(() => {
          // sem conexão: mantém o valor; o banco confere o total no envio (PRECO_MUDOU)
        });
      },
      Math.max(0, falta),
    );
    return () => clearTimeout(relogio);
  }, [calculadoEm]);

  return valido;
}
