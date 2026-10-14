// Tipos do cardápio, no formato que as views `cardapio_vw_home` e
// `cardapio_vw_produtos` devolvem (ver supabase_cardapio_online.sql no ERP).

/** Unidade de venda: o preço é do BLOCO inteiro (ex.: Mala c/ 6 = R$ 54). */
export interface Oferta {
  id: string;
  nome: string;
  qtd: number;
  preco: number;
  preco_cartao: number;
  quente: boolean;
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
  gelada: boolean;
  destaque: boolean;
  selo: string | null;
  ordem: number;
  vendas_recentes: number;
  ofertas: Oferta[];
}

export interface Loja {
  nome: string;
  telefone: string | null;
  logo_url: string | null;
  bairro: string | null;
  cidade: string | null;
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
  ordem: number;
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
  horarios: Horario[];
  banners: Banner[];
  categorias: Categoria[];
  vitrines: Vitrine[];
}

export type FormaPagamento = 'pix' | 'dinheiro' | 'credito' | 'debito';

/** Item do carrinho: uma oferta + quantos BLOCOS dela. */
export interface ItemCarrinho {
  ofertaId: string;
  quantidade: number;
}

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
  itens: { oferta_id: string; quantidade: number }[];
  pagamento: FormaPagamento;
  troco_para: number | null;
  observacoes: string;
}

export interface RespostaPedido {
  pedido_id: string;
  numero: number;
  subtotal: number;
  frete: number;
  total: number;
}
