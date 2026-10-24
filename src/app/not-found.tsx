import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NaoEncontrado() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-16 h-16 rounded-full bg-bloco flex items-center justify-center text-suave" aria-hidden="true">
        <SearchX className="w-8 h-8" />
      </div>
      <h1 className="text-[20px] font-black mt-4">Não encontramos essa página</h1>
      <p className="text-[14px] text-suave mt-1">O produto ou a categoria pode ter saído do cardápio.</p>
      <Link href="/" className="mt-5 h-12 px-6 rounded-lg bg-primaria text-primaria-texto font-bold text-[15px] inline-flex items-center">
        Voltar ao cardápio
      </Link>
    </main>
  );
}
