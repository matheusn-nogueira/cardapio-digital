// Leitura do cardápio no servidor (Server Components), com revalidação curta.
import { cache } from 'react';
import { normalizarTexto } from './formatacao';
import { ofertaPromocional, separarVariantes } from './ofertas';
import { ofertasDeVenda } from './precoQuantidade';
import { cabecalhosSupabase, urlRest } from './supabase';
import type {
  Banner,
  Categoria,
  ConfigCardapio,
  DadosHome,
  Horario,
  Loja,
  Produto,
  Variante,
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
  mensagem_fechado: 'Estamos fechados agora. Monte sua sacola e faça o pedido quando abrirmos.',
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
    frete_minimo: null,
    horarios: lista<Horario>(bruto.horarios),
    banners: lista<Banner>(bruto.banners).map((b) => ({ ...b, ordem: num(b.ordem) })),
    categorias: lista<Categoria>(bruto.categorias).map((c) => ({
      ...c,
      categorias_produto: lista<string>(c.categorias_produto),
    })),
    vitrines: lista<Vitrine>(bruto.vitrines).map((v) => ({ ...v, produtos: lista<string>(v.produtos) })),
  };
}

const ehQuente = (texto: unknown) => /^\s*\[quente\]/i.test(String(texto ?? ''));

/** Colunas da view que o site usa (o resto não vem do banco). */
export const COLUNAS_PRODUTO =
  'id,nome,nome_original,categoria,marca,descricao,imagem_url,preco,preco_cartao,retornavel,gelada,selo,ordem,vendas_recentes,ofertas,apelidos';

/** Apelidos/tags sem acento que acrescentam algo ao nome (o resto só pesaria no payload). */
function apelidosUteis(bruto: unknown, nome: string, marca: string | null, categoria: string): string {
  const base = normalizarTexto([nome, marca ?? '', categoria].join(' '));
  const vistos = new Set<string>();
  for (const a of lista<unknown>(bruto)) {
    const texto = normalizarTexto(String(a ?? ''));
    if (!texto || vistos.has(texto)) continue;
    // apelido cujas palavras já estão todas no nome não ajuda a busca
    if (texto.split(/\s+/).every((palavra) => base.includes(palavra))) continue;
    vistos.add(texto);
  }
  return [...vistos].join(' ');
}

/** Produto como vem do banco, com os campos de ordenação (ficam só no servidor). */
export interface ProdutoOrdenavel extends Produto {
  ordem: number;
  vendas_recentes: number;
}

/** Ofertas do banco com id, já separadas em combinação automática e variantes. */
export function classificarOfertas(p: Record<string, unknown>): {
  quente: boolean;
  venda: Variante[];
  variantes: Variante[];
} {
  // mesma regra do banco: produto é quente pelo nome original ("[Quente] …")
  const quente = p.nome_original != null ? ehQuente(p.nome_original) : p.gelada === false;
  const brutas = lista<Record<string, unknown>>(p.ofertas)
    .map(
      (o): Variante => ({
        id: String(o.id),
        nome: String(o.nome ?? ''),
        qtd: Math.max(1, num(o.qtd, 1)),
        preco: num(o.preco),
        preco_cartao: num(o.preco_cartao, num(o.preco)),
        quente: o.quente === true,
      }),
    )
    .filter((o) => o.preco > 0);
  return { quente, ...separarVariantes(brutas, quente) };
}

/**
 * Mantém só os campos que o site usa (o catálogo vai inteiro para o navegador).
 * Blocos da combinação vão sem id; variantes (escolha explícita) levam o id da oferta.
 */
const MOSTRAR_NATURAL = false;

export function normalizarProduto(p: Record<string, unknown>): ProdutoOrdenavel {
  const { quente, venda, variantes } = classificarOfertas(p);
  const nome = String(p.nome ?? '');
  const categoria = String(p.categoria ?? '');
  const marca = (p.marca as string | null) ?? null;
  return {
    id: String(p.id),
    nome,
    categoria,
    marca,
    descricao: (p.descricao as string | null)?.trim() || null,
    imagem_url: (p.imagem_url as string | null) || null,
    preco: num(p.preco),
    preco_cartao: num(p.preco_cartao, num(p.preco)),
    retornavel: p.retornavel === true,
    selo: (p.selo as string | null)?.trim() || null,
    quente,
    apelidos: apelidosUteis(p.apelidos, nome, marca, categoria),
    // blocos da combinação vão sem id (só a variante precisa dele)
    ofertas: ofertasDeVenda({
      quente,
      ofertas: venda.map((o) => ({ nome: o.nome, qtd: o.qtd, preco: o.preco, preco_cartao: o.preco_cartao, quente: o.quente })),
    }),
    // versão natural (sem gelar) fora do site por enquanto (decisão do dono, 26/10/2026): a escolha
    // gelada/natural atrapalhava a maioria. Para voltar, troque MOSTRAR_NATURAL (o ideal seria uma
    // seção à parte só de itens naturais, não a escolha em cada produto).
    variantes: MOSTRAR_NATURAL ? variantes : variantes.filter((v) => !v.quente),
    ordem: num(p.ordem, 9999),
    vendas_recentes: num(p.vendas_recentes),
  };
}

/** Ordem padrão de listagem: ordem manual → mais vendidos → nome. */
export function compararProdutos(a: ProdutoOrdenavel, b: ProdutoOrdenavel): number {
  return a.ordem - b.ordem || b.vendas_recentes - a.vendas_recentes || a.nome.localeCompare(b.nome, 'pt-BR');
}

/** Tira os campos que só servem para ordenar. */
export function paraCliente(p: ProdutoOrdenavel): Produto {
  const produto: Produto & Partial<Pick<ProdutoOrdenavel, 'ordem' | 'vendas_recentes'>> = { ...p };
  delete produto.ordem;
  delete produto.vendas_recentes;
  return produto;
}

/**
 * Menor taxa de entrega: o frete calculado no ponto da própria loja (faixa de 0 km).
 * null quando a loja não tem localização, não há faixa ou o banco não responde.
 */
async function buscarFreteMinimo(loja: Loja): Promise<number | null> {
  if (loja.latitude == null || loja.longitude == null) return null;
  try {
    const resposta = await fetch(urlRest('rpc/cardapio_calcular_frete'), {
      method: 'POST',
      headers: cabecalhosSupabase({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_lat: loja.latitude, p_lng: loja.longitude }),
      next: { revalidate: REVALIDAR_SEGUNDOS * 5 },
    });
    if (!resposta.ok) return null;
    const d = (await resposta.json()) as { frete?: unknown; bloqueado?: unknown };
    return d.bloqueado === true ? null : numOuNulo(d.frete);
  } catch {
    return null;
  }
}

export const buscarHome = cache(async (): Promise<DadosHome> => {
  const linhas = await consultar<{ dados: Record<string, unknown> }[]>('cardapio_vw_home?select=dados');
  if (!linhas[0]?.dados) throw new Error('cardapio_vw_home vazia');
  const home = normalizarHome(linhas[0].dados);
  return { ...home, frete_minimo: await buscarFreteMinimo(home.loja) };
});

export const buscarProdutos = cache(async (): Promise<Produto[]> => {
  const linhas = await consultar<Record<string, unknown>[]>(`cardapio_vw_produtos?select=${COLUNAS_PRODUTO}`);
  return linhas
    .map(normalizarProduto)
    .filter((p) => p.ofertas.length > 0)
    .sort(compararProdutos)
    .map(paraCliente);
});

function regex(padrao: string | undefined): RegExp | null {
  if (!padrao) return null;
  try {
    return new RegExp(padrao, 'i');
  } catch {
    return null; // regex inválida no banco não derruba o cardápio: o filtro é ignorado
  }
}

export function produtosDaCategoria(produtos: Produto[], categoria: Categoria): Produto[] {
  const nomes = new Set(categoria.categorias_produto);
  const f = categoria.filtro;
  const casa = regex(f?.nome);
  const exclui = regex(f?.excluir_nome);
  return produtos.filter(
    (p) =>
      nomes.has(p.categoria) &&
      (!f?.promo || p.ofertas.some(ofertaPromocional)) &&
      (!casa || casa.test(p.nome)) &&
      (!exclui || !exclui.test(p.nome)),
  );
}

/** Foto que representa a categoria no atalho da home: a do primeiro produto dela com imagem. */
export function imagemDaCategoria(categoria: Categoria, produtos: Produto[]): string | null {
  return produtosDaCategoria(produtos, categoria).find((p) => p.imagem_url)?.imagem_url ?? null;
}

/** Foto que representa a marca (não há logos no banco): a do primeiro produto dela com imagem. */
export function fotoDaMarca(marca: string, produtos: Produto[]): string | null {
  const alvo = marca.trim().toLowerCase();
  return produtos.find((p) => p.marca?.trim().toLowerCase() === alvo && p.imagem_url)?.imagem_url ?? null;
}
