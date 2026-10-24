import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="text-[48px]" aria-hidden="true">
        🔎
      </div>
      <h1 className="text-[20px] font-black mt-2">Não encontramos essa página</h1>
      <p className="text-[14px] text-suave mt-1">O produto ou a categoria pode ter saído do cardápio.</p>
      <Link href="/" className="mt-5 h-12 px-6 rounded-lg bg-primaria text-primaria-texto font-bold text-[15px] inline-flex items-center">
        Voltar ao cardápio
      </Link>
    </main>
  );
}
