'use client';

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <h1 className="text-[20px] font-black">Não conseguimos carregar o cardápio</h1>
      <p className="text-[14px] text-suave mt-1">Verifique sua internet e tente de novo.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 h-12 px-6 rounded-xl bg-primaria text-primaria-texto font-bold text-[15px]"
      >
        Tentar de novo
      </button>
    </main>
  );
}
