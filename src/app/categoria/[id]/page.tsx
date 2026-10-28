import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CategoriasLista } from '@/components/loja/CategoriasLista';
import { ListaCategoria } from '@/components/loja/ListaCategoria';
import { buscarEsgotados, buscarHome, buscarProdutos, imagemDaCategoria, produtosDaCategoria } from '@/lib/cardapio';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Gera as categorias atuais no build; novas entram sob demanda (ISR).
export async function generateStaticParams() {
  const home = await buscarHome();
  return home.categorias.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const home = await buscarHome();
  const categoria = home.categorias.find((c) => c.id === id);
  return { title: categoria?.nome ?? 'Categoria' };
}

export default async function CategoriaPage({ params }: Props) {
  const { id } = await params;
  const [home, produtos, esgotados] = await Promise.all([buscarHome(), buscarProdutos(), buscarEsgotados()]);
  const categoria = home.categorias.find((c) => c.id === id);
  if (!categoria) notFound();

  const daCategoria = produtosDaCategoria(produtos, categoria);
  const categorias = home.categorias
    .filter((c) => produtosDaCategoria(produtos, c).length > 0)
    .map((c) => ({ ...c, imagem_url: c.imagem_url ?? imagemDaCategoria(c, produtos) }));

  return (
    <main className="pb-4 min-h-screen max-w-[1100px] mx-auto bg-white">
      <CategoriasLista categorias={categorias} ativaId={categoria.id} compacta />
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" aria-label="Voltar ao início" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="font-condensed text-[24px] font-bold uppercase tracking-[0.03em] leading-tight">{categoria.nome}</h1>
        </div>
        <ListaCategoria ids={daCategoria.map((p) => p.id)} idsEsgotados={produtosDaCategoria(esgotados, categoria).map((p) => p.id)} />
      </div>
    </main>
  );
}
