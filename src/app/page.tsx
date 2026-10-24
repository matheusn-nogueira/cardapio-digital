import { BannerCarrossel } from '@/components/loja/BannerCarrossel';
import { CategoriasLista } from '@/components/loja/CategoriasLista';
import { MarcasLista, marcasDoCatalogo } from '@/components/loja/MarcasLista';
import { PopupPromo } from '@/components/loja/PopupPromo';
import { StatusLojaCard } from '@/components/loja/StatusLojaCard';
import { Vitrine } from '@/components/loja/Vitrine';
import { buscarHome, buscarProdutos, imagemDaCategoria, produtosDaCategoria } from '@/lib/cardapio';

export const revalidate = 60;

export default async function Home() {
  const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
  // atalhos com foto: a da categoria no ERP ou, sem ela, a de um produto da categoria
  const categorias = home.categorias
    .filter((c) => produtosDaCategoria(produtos, c).length > 0)
    .map((c) => ({ ...c, imagem_url: c.imagem_url ?? imagemDaCategoria(c, produtos) }));
  const marcas = marcasDoCatalogo(produtos);
  const vitrine = (v: (typeof home.vitrines)[number]) => (
    <Vitrine
      key={v.id}
      titulo={v.titulo}
      ids={v.produtos}
      linkVerTodos={v.tipo === 'categoria' && v.categoria_id ? `/categoria/${v.categoria_id}` : undefined}
    />
  );
  const [primeira, ...demais] = home.vitrines;

  return (
    // Ordem do app do Zé: chips de categoria, recomendados, marcas, destaques e o resto das prateleiras
    <main className="pb-4 min-h-screen max-w-[1100px] mx-auto bg-white">
      <h1 className="sr-only">{home.loja.nome} — cardápio</h1>
      <PopupPromo />
      <CategoriasLista categorias={categorias} />
      <StatusLojaCard />
      <div className="pt-5">{primeira && vitrine(primeira)}</div>
      <MarcasLista marcas={marcas} />
      <BannerCarrossel banners={home.banners} />
      <div className="pt-3 pb-1">{demais.map(vitrine)}</div>
    </main>
  );
}
