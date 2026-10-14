import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResultadosBusca } from '@/components/loja/ResultadosBusca';

export const metadata: Metadata = { title: 'Buscar' };

export default function BuscaPage() {
  return (
    <main className="px-4 pt-4 pb-4 min-h-screen max-w-[1100px] mx-auto">
      <Suspense fallback={<p className="text-suave text-[14px]">Carregando…</p>}>
        <ResultadosBusca />
      </Suspense>
    </main>
  );
}
