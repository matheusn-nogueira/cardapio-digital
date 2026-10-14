// Conexão com o Supabase (PostgREST direto via fetch, sem SDK).
// A chave anon é pública (já vai no bundle dos front-ends da loja); o banco
// protege o que importa por RLS e pelas funções `cardapio_*`.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkbvmqnrdgnhiyhtgsjy.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYnZtcW5yZGduaGl5aHRnc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc1OTYsImV4cCI6MjA4Nzc5MzU5Nn0.pKdIKjLDnaNnTZ0PFRiZ6yCYVxCos1ckXtsr7uwDrrY';

export function cabecalhosSupabase(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

export function urlRest(caminho: string): string {
  return `${SUPABASE_URL}/rest/v1/${caminho}`;
}
