import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BotaoCompartilharProduto } from '@/components/loja/Divulgar';
import { ProdutoDetalhe } from '@/components/loja/ProdutoDetalhe';
import { buscarHome, buscarProdutos } from '@/lib/cardapio';
import { formatarPreco } from '@/lib/formatacao';
import { melhorPreco } from '@/lib/precoQuantidade';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Páginas de produto são geradas sob demanda e ficam em cache (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [produto, { loja }] = await Promise.all([buscarProdutos().then((ps) => ps.find((p) => p.id === id)), buscarHome()]);
  if (!produto) return { title: 'Produto' };
  // prévia do link compartilhado (28/10/2026): nome e preço no texto; a foto vem do opengraph-image ao lado
  const nome = loja.nome || 'Casa dos Fundos';
  const descricao = `${formatarPreco(melhorPreco(produto, 1, false).total)} na ${nome}. Peça pelo cardápio com entrega.`;
  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produto/${id}` },
    openGraph: { type: 'website', locale: 'pt_BR', url: `/produto/${id}`, siteName: nome, title: produto.nome, description: descricao },
    twitter: { card: 'summary_large_image', title: produto.nome, description: descricao },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { id } = await params;
  const produto = (await buscarProdutos()).find((p) => p.id === id);
  if (!produto) notFound();

  return (
    <main className="px-4 pt-3 pb-6 min-h-screen max-w-[520px] mx-auto bg-white">
      <div className="flex items-center justify-between mb-1">
        <Link href="/" className="inline-flex items-center gap-1.5 h-10 text-[14px] font-medium">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Voltar ao cardápio
        </Link>
        <BotaoCompartilharProduto produto={produto} className="bg-bloco" />
      </div>
      <ProdutoDetalhe produto={produto} paginaPropria />
    </main>
  );
}
