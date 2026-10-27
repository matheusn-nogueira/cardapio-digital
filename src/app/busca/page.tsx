import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResultadosBusca } from '@/components/loja/ResultadosBusca';
import { buscarHome, buscarProdutos, produtosDaCategoria } from '@/lib/cardapio';

export const metadata: Metadata = { title: 'Buscar' };
export const revalidate = 60;

export default async function BuscaPage() {
  const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
  // categoria sem produto não vira banner
  const categorias = home.categorias.filter((c) => produtosDaCategoria(produtos, c).length > 0);
  return (
    <main className="px-4 pt-4 pb-4 min-h-screen max-w-[1100px] mx-auto bg-white">
      <Suspense fallback={<p className="text-suave text-[14px]">Carregando…</p>}>
        <ResultadosBusca categorias={categorias} />
      </Suspense>
    </main>
  );
}
