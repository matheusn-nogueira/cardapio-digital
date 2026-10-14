// Formatação e máscaras (pt-BR).

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(valor: number): string {
  return moeda.format(valor);
}

export function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** (21) 99766-2138 */
export function mascararTelefone(texto: string): string {
  const d = apenasDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 21710-000 */
export function mascararCep(texto: string): string {
  const d = apenasDigitos(texto).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Link do WhatsApp com DDI 55 quando o número vier só com DDD. */
export function linkWhatsapp(numero: string | null | undefined, mensagem?: string): string | null {
  const d = apenasDigitos(numero ?? '');
  if (d.length < 10) return null;
  const comDdi = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${comDdi}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}

/** Minúsculas e sem acento, para busca. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Só aceita cor hexa (evita injetar CSS vindo do banco). */
export function corSegura(cor: string | null | undefined, padrao: string): string {
  return cor && /^#[0-9a-f]{3,8}$/i.test(cor.trim()) ? cor.trim() : padrao;
}

/** Só links http(s) saem do site. */
export function urlExternaSegura(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}
