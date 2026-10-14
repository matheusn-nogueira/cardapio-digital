'use client';

// Erro no layout raiz (ex.: Supabase fora do ar no primeiro carregamento).
export default function ErroGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'Arial, sans-serif', background: '#F5F5F5', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>Não conseguimos carregar o cardápio</h1>
          <p style={{ color: '#626262', fontSize: 14 }}>Verifique sua internet e tente de novo em instantes.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, height: 48, padding: '0 24px', borderRadius: 12, border: 0, background: '#F2B705', color: '#1A1A1A', fontWeight: 700, fontSize: 15 }}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
