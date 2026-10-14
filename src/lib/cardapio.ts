// Leitura do cardápio no servidor (Server Components), com revalidação curta.
import { cache } from 'react';
import { cabecalhosSupabase, urlRest } from './supabase';
import type {
  Banner,
  Categoria,
  ConfigCardapio,
  DadosHome,
  Horario,
  Loja,
  Oferta,
  Produto,
  Vitrine,
} from './tipos';

/** Segundos que home/catálogo ficam em cache antes de buscar de novo no banco. */
export const REVALIDAR_SEGUNDOS = 60;

async function consultar<T>(caminho: string, revalidar: number | false = REVALIDAR_SEGUNDOS): Promise<T> {
  const resposta = await fetch(urlRest(caminho), {
    headers: cabecalhosSupabase(),
    ...(revalidar === false ? { cache: 'no-store' as const } : { next: { revalidate: revalidar } }),
  });
  if (!resposta.ok) {
    throw new Error(`Supabase respondeu ${resposta.status} em ${caminho.split('?')[0]}`);
  }
  return resposta.json() as Promise<T>;
}

const num = (v: unknown, padrao = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? padrao : Number(v));
const numOuNulo = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const lista = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const CONFIG_PADRAO: ConfigCardapio = {
  slogan: 'Bebida gelada na sua porta',
  cor_primaria: '#F2B705',
  cor_texto_primaria: '#1A1A1A',
  whatsapp: null,
  pedido_minimo: 0,
  frete_gratis_acima: null,
  tempo_entrega_min: 30,
  tempo_entrega_max: 60,
  status_loja: 'automatico',
  mensagem_fechado: 'Estamos fechados agora. Volte no nosso horário de funcionamento!',
  aviso_topo: null,
  pedir_confirmacao_idade: true,
  aceita_pix: true,
  aceita_dinheiro: true,
  aceita_cartao_entrega: true,
  chave_pix: null,
};

/** Garante tipos/arrays mesmo se alguma lista vier `null` (jsonb_agg vazio). */
export function normalizarHome(bruto: Record<string, unknown>): DadosHome {
  const loja = (bruto.loja ?? {}) as Partial<Loja>;
  const cfg = { ...CONFIG_PADRAO, ...((bruto.config ?? {}) as Partial<ConfigCardapio>) };
  return {
    loja: {
      nome: loja.nome || 'Cardápio',
      telefone: loja.telefone ?? null,
      logo_url: loja.logo_url || null,
      bairro: loja.bairro ?? null,
      cidade: loja.cidade ?? null,
      latitude: numOuNulo(loja.latitude),
      longitude: numOuNulo(loja.longitude),
    },
    config: {
      ...cfg,
      pedido_minimo: num(cfg.pedido_minimo),
      frete_gratis_acima: numOuNulo(cfg.frete_gratis_acima),
      tempo_entrega_min: num(cfg.tempo_entrega_min, 30),
      tempo_entrega_max: num(cfg.tempo_entrega_max, 60),
      aviso_topo: cfg.aviso_topo?.trim() || null,
      chave_pix: cfg.chave_pix?.trim() || null,
    },
    aberta: bruto.aberta === true,
    horarios: lista<Horario>(bruto.horarios),
    banners: lista<Banner>(bruto.banners).map((b) => ({ ...b, ordem: num(b.ordem) })),
    categorias: lista<Categoria>(bruto.categorias).map((c) => ({
      ...c,
      categorias_produto: lista<string>(c.categorias_produto),
    })),
    vitrines: lista<Vitrine>(bruto.vitrines).map((v) => ({ ...v, produtos: lista<string>(v.produtos) })),
  };
}

/** Mantém só os campos que o site usa (o catálogo vai inteiro para o cliente). */
export function normalizarProduto(p: Record<string, unknown>): Produto {
  return {
    id: String(p.id),
    nome: String(p.nome ?? ''),
    categoria: String(p.categoria ?? ''),
    marca: (p.marca as string | null) ?? null,
    descricao: (p.descricao as string | null)?.trim() || null,
    imagem_url: (p.imagem_url as string | null) || null,
    preco: num(p.preco),
    preco_cartao: num(p.preco_cartao, num(p.preco)),
    retornavel: p.retornavel === true,
    gelada: p.gelada !== false,
    destaque: p.destaque === true,
    selo: (p.selo as string | null)?.trim() || null,
    ordem: num(p.ordem, 9999),
    vendas_recentes: num(p.vendas_recentes),
    ofertas: lista<Record<string, unknown>>(p.ofertas).map(
      (o): Oferta => ({
        id: String(o.id),
        nome: String(o.nome ?? ''),
        qtd: Math.max(1, num(o.qtd, 1)),
        preco: num(o.preco),
        preco_cartao: num(o.preco_cartao, num(o.preco)),
        quente: o.quente === true,
      }),
    ),
  };
}

/** Ordem padrão de listagem: ordem manual → mais vendidos → nome. */
export function compararProdutos(a: Produto, b: Produto): number {
  return a.ordem - b.ordem || b.vendas_recentes - a.vendas_recentes || a.nome.localeCompare(b.nome, 'pt-BR');
}

export const buscarHome = cache(async (): Promise<DadosHome> => {
  const linhas = await consultar<{ dados: Record<string, unknown> }[]>('cardapio_vw_home?select=dados');
  if (!linhas[0]?.dados) throw new Error('cardapio_vw_home vazia');
  return normalizarHome(linhas[0].dados);
});

export const buscarProdutos = cache(async (): Promise<Produto[]> => {
  const linhas = await consultar<Record<string, unknown>[]>('cardapio_vw_produtos?select=*');
  return linhas
    .map(normalizarProduto)
    .filter((p) => p.ofertas.length > 0)
    .sort(compararProdutos);
});

export function produtosDaCategoria(produtos: Produto[], categoria: Categoria): Produto[] {
  const nomes = new Set(categoria.categorias_produto);
  return produtos.filter((p) => nomes.has(p.categoria));
}
