// Tipos do cardápio, no formato que as views `cardapio_vw_home` e
// `cardapio_vw_produtos` devolvem (ver supabase_cardapio_online.sql no ERP).

/**
 * Bloco de venda: o preço é do BLOCO inteiro (ex.: Mala c/ 6 = R$ 54). Na versão
 * padrão o cliente escolhe UNIDADES e a sacola monta a combinação de blocos mais
 * barata (ver precoQuantidade.ts) — por isso esses blocos vêm sem id.
 */
export interface Oferta {
  nome: string;
  qtd: number;
  preco: number;
  preco_cartao: number;
  quente: boolean;
}

/**
 * Versão escolhida explicitamente pelo cliente, com preço FECHADO do bloco:
 * pack [Quente] de produto gelado, galão com vasilhame (unidade mais cara)…
 * Vai para o banco como `{oferta_id, quantidade}` (quantidade = blocos).
 */
export interface Variante extends Oferta {
  id: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  marca: string | null;
  descricao: string | null;
  imagem_url: string | null;
  preco: number;
  preco_cartao: number;
  retornavel: boolean;
  selo: string | null;
  /** Produto natural ("[Quente]" no nome original) — mesma regra do banco. */
  quente: boolean;
  /** Apelidos/tags (sem acento) que não estão no nome — só para a busca. */
  apelidos: string;
  /** Blocos da combinação automática (versão padrão). */
  ofertas: Oferta[];
  /** Versões de escolha explícita (natural, vasilhame…). Fora da combinação. */
  variantes: Variante[];
}

export interface Loja {
  nome: string;
  telefone: string | null;
  logo_url: string | null;
  bairro: string | null;
  cidade: string | null;
  /** rua e número da loja ("Avenida Pirpirituba, 532"), para "Sobre a loja" */
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ConfigCardapio {
  slogan: string;
  cor_primaria: string;
  cor_texto_primaria: string;
  whatsapp: string | null;
  pedido_minimo: number;
  frete_gratis_acima: number | null;
  tempo_entrega_min: number;
  tempo_entrega_max: number;
  status_loja: 'automatico' | 'aberto' | 'fechado';
  mensagem_fechado: string;
  aviso_topo: string | null;
  pedir_confirmacao_idade: boolean;
  aceita_pix: boolean;
  aceita_dinheiro: boolean;
  aceita_cartao_entrega: boolean;
  chave_pix: string | null;
}

/** dia_semana: 0 = domingo. fecha <= abre = passa da meia-noite. */
export interface Horario {
  dia_semana: number;
  aberto: boolean;
  abre: string;
  fecha: string;
}

export type TipoLinkBanner = 'nenhum' | 'categoria' | 'produto' | 'url';

export interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string | null;
  cor_fundo: string;
  link_tipo: TipoLinkBanner;
  link_valor: string | null;
  ordem: number;
}

export interface Categoria {
  id: string;
  nome: string;
  icone: string | null;
  imagem_url: string | null;
  cor_fundo: string;
  /** Valores de `produto.categoria` que entram nesta categoria do cardápio. */
  categorias_produto: string[];
  /** Recorte opcional dentro de `categorias_produto` (promoções, marca, sem álcool…). */
  filtro?: FiltroCategoria | null;
  ordem: number;
}

export interface FiltroCategoria {
  /** Só produtos com oferta "[Promo]". */
  promo?: boolean;
  /** Regex (sem diferenciar maiúsculas) que o nome do produto precisa casar. */
  nome?: string;
  /** Regex que o nome do produto NÃO pode casar. */
  excluir_nome?: string;
}

export interface Vitrine {
  id: string;
  titulo: string;
  tipo: 'manual' | 'categoria' | 'mais_vendidos' | 'destaques';
  categoria_id: string | null;
  /** Ids de produto, já na ordem de exibição. */
  produtos: string[];
}

export interface DadosHome {
  loja: Loja;
  config: ConfigCardapio;
  aberta: boolean;
  /** Menor taxa de entrega (faixa mais perto da loja); null = sem faixas ou loja sem localização. */
  frete_minimo: number | null;
  horarios: Horario[];
  banners: Banner[];
  categorias: Categoria[];
  vitrines: Vitrine[];
}

/** Cartão na entrega é uma opção só (crédito ou débito na maquininha). */
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao';

/** Item do carrinho: um produto + quantas UNIDADES dele. */
export interface ItemCarrinho {
  produtoId: string;
  unidades: number;
}

/** Linha de versão escolhida (variante): quantos BLOCOS da oferta. */
export interface ItemVariante {
  produtoId: string;
  ofertaId: string;
  quantidade: number;
}

/** Formato antigo salvo no navegador (oferta + quantos blocos, sem produto): migrado ao abrir. */
export interface ItemLegado {
  ofertaId: string;
  quantidade: number;
  produtoId?: never;
}

export type ItemSalvo = ItemCarrinho | ItemVariante | ItemLegado;

/** Item como vai para `cardapio_criar_pedido`. */
export type ItemPedido = { product_id: string; unidades: number } | { oferta_id: string; quantidade: number };

export interface ResultadoFrete {
  distancia_km: number | null;
  /** null = loja ou endereço sem localização → "frete a confirmar". */
  frete: number | null;
  bloqueado: boolean;
}

export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Cliente {
  nome: string;
  telefone: string;
}

export interface PayloadPedido {
  cliente: Cliente;
  endereco: Endereco;
  itens: ItemPedido[];
  pagamento: FormaPagamento;
  troco_para: number | null;
  observacoes: string;
  /** uuid por tentativa de checkout: reenvio com a mesma chave não duplica o pedido. */
  chave: string;
  /** Total que o cliente viu; se o banco calcular outro, devolve PRECO_MUDOU. */
  total_esperado: number;
}

export interface RespostaPedido {
  pedido_id: string;
  numero: number;
  subtotal: number;
  frete: number;
  total: number;
  /** true = a mesma chave já tinha gerado esse pedido (reenvio). */
  repetido: boolean;
}

/** Valores recalculados pelo banco (DETAIL do erro PRECO_MUDOU). */
export interface TotaisServidor {
  subtotal: number;
  frete: number;
  total: number;
}
