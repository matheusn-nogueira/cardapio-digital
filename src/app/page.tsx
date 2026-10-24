import { BannerCarrossel } from '@/components/loja/BannerCarrossel';
import { CategoriasLista } from '@/components/loja/CategoriasLista';
import { MarcasLista, marcasDoCatalogo } from '@/components/loja/MarcasLista';
import { StatusLojaCard } from '@/components/loja/StatusLojaCard';
import { Vitrine } from '@/components/loja/Vitrine';
import { buscarHome, buscarProdutos, produtosDaCategoria } from '@/lib/cardapio';

export const revalidate = 60;

export default async function Home() {
  const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
  const categorias = home.categorias.filter((c) => produtosDaCategoria(produtos, c).length > 0);

  return (
    // Fundo branco contínuo, seções separadas só por espaço (como no Zé)
    <main className="pb-4 min-h-screen max-w-[1100px] mx-auto bg-white">
      <h1 className="sr-only">{home.loja.nome} — cardápio</h1>
      <StatusLojaCard />
      <BannerCarrossel banners={home.banners} />
      <CategoriasLista categorias={categorias} />
      <MarcasLista marcas={marcasDoCatalogo(produtos)} />

      <div className="pt-2 pb-1">
        {home.vitrines.map((v) => (
          <Vitrine
            key={v.id}
            titulo={v.titulo}
            ids={v.produtos}
            linkVerTodos={v.tipo === 'categoria' && v.categoria_id ? `/categoria/${v.categoria_id}` : undefined}
          />
        ))}
      </div>
    </main>
  );
}
