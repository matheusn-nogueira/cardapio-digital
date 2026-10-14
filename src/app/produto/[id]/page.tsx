import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProdutoDetalhe } from '@/components/loja/ProdutoDetalhe';
import { buscarProdutos } from '@/lib/cardapio';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Páginas de produto são geradas sob demanda e ficam em cache (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const produto = (await buscarProdutos()).find((p) => p.id === id);
  return { title: produto?.nome ?? 'Produto' };
}

export default async function ProdutoPage({ params }: Props) {
  const { id } = await params;
  const produto = (await buscarProdutos()).find((p) => p.id === id);
  if (!produto) notFound();

  return (
    <main className="px-4 pt-3 pb-6 min-h-screen max-w-[520px] mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 h-10 text-[14px] font-medium mb-1">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Voltar ao cardápio
      </Link>
      <ProdutoDetalhe produto={produto} paginaPropria />
    </main>
  );
}
