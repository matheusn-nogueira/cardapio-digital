import React from 'react';
import { PenLine } from 'lucide-react';

export const InstructionsCard: React.FC<{ valor: string; aoMudar: (valor: string) => void }> = ({ valor, aoMudar }) => {
  return (
    <section className="bg-white rounded-lg p-4 mb-3 shadow-cartao">
      <div className="flex items-start gap-3">
        <PenLine className="w-5 h-5 text-tinta shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 w-full">
          <label htmlFor="observacoes" className="text-[14px] font-medium uppercase tracking-wide text-rotulo block">
            Observações <span className="font-normal normal-case tracking-normal text-suave text-[13px]">(opcional)</span>
          </label>
          <textarea
            id="observacoes"
            value={valor}
            maxLength={500}
            onChange={(e) => aoMudar(e.target.value)}
            className="w-full min-h-[76px] mt-2 p-3 border border-borda rounded-lg text-[16px] text-tinta resize-none outline-none focus:border-tinta"
            placeholder="Ex.: tocar o interfone 302, gelo à parte…"
          />
        </div>
      </div>
    </section>
  );
};
