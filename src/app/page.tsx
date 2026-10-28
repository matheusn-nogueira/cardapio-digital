import { BannerCarrossel } from '@/components/loja/BannerCarrossel';
import { CategoriasLista } from '@/components/loja/CategoriasLista';
import { MarcasLista, marcasDoCatalogo } from '@/components/loja/MarcasLista';
import { PecaDeNovo } from '@/components/loja/PecaDeNovo';
import { PopupPromo } from '@/components/loja/PopupPromo';
import { StatusLojaCard } from '@/components/loja/StatusLojaCard';
import { Vitrine } from '@/components/loja/Vitrine';
import { buscarHome, buscarProdutos, imagemDaCategoria, produtosDaCategoria } from '@/lib/cardapio';

export const revalidate = 60;

/** Produtos por prateleira de categoria; o resto fica na seta "ver todos". */
const ITENS_POR_PRATELEIRA = 10;

export default async function Home() {
  const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
  // atalhos com foto: a da categoria no ERP ou, sem ela, a de um produto da categoria
  const categorias = home.categorias
    .filter((c) => produtosDaCategoria(produtos, c).length > 0)
    .map((c) => ({ ...c, imagem_url: c.imagem_url ?? imagemDaCategoria(c, produtos) }));
  // toda marca de cerveja do catálogo, mesmo com um produto só (Bohemia, Petra…)
  const marcas = marcasDoCatalogo(produtos, 1);
  const vitrine = (v: (typeof home.vitrines)[number], opcoes: { prioridade?: boolean; adiada?: boolean } = {}) => (
    <Vitrine
      {...opcoes}
      key={v.id}
      titulo={v.titulo}
      ids={v.produtos}
      linkVerTodos={v.tipo === 'categoria' && v.categoria_id ? `/categoria/${v.categoria_id}` : undefined}
      categoriaId={v.tipo === 'categoria' ? v.categoria_id ?? undefined : undefined}
    />
  );
  const [primeira, ...demais] = home.vitrines;
  // o cardápio inteiro, como no 99 e no Zé: uma prateleira por categoria (menos as que já viraram vitrine)
  const jaNaVitrine = new Set(home.vitrines.map((v) => v.categoria_id).filter(Boolean));
  const prateleiras = categorias
    .filter((c) => !jaNaVitrine.has(c.id))
    .map((c) => ({ ...c, ids: produtosDaCategoria(produtos, c).slice(0, ITENS_POR_PRATELEIRA).map((p) => p.id) }));

  return (
    // Ordem do app do Zé: chips de categoria, banners, recomendados, marcas e o resto das prateleiras
    <main className="pb-4 min-h-screen max-w-[1100px] mx-auto bg-white">
      <h1 className="sr-only">{home.loja.nome} — cardápio</h1>
      <PopupPromo />
      <CategoriasLista categorias={categorias} acompanharRolagem />
      <BannerCarrossel banners={home.banners} />
      <StatusLojaCard />
      <PecaDeNovo />
      <div className="pt-8">{primeira && vitrine(primeira, { prioridade: true })}</div>
      <MarcasLista marcas={marcas} />
      <div>
        {/* as de baixo só montam os cards quando a pessoa rola até perto (Vitrine `adiada`) */}
        {demais.map((v) => vitrine(v, { adiada: true }))}
        {prateleiras.map((c) => (
          <Vitrine key={c.id} titulo={c.nome} ids={c.ids} linkVerTodos={`/categoria/${c.id}`} categoriaId={c.id} adiada />
        ))}
      </div>
    </main>
  );
}
