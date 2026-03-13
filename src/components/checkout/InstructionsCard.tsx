import React from 'react';
import { PenLine } from 'lucide-react';

export const InstructionsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 mb-3.5">
      <div className="flex items-start gap-3.5">
        <PenLine className="w-5 h-5 text-[#FFC500] shrink-0 mt-0.5" />
        <div className="flex-1 w-full">
          <div className="text-[15px] font-semibold mb-0.5">Observações</div>
          <textarea
            className="w-full min-h-[70px] mt-2.5 p-3 border border-[#eee] rounded-lg text-[14px] text-[#696969] resize-none outline-none focus:border-[#FFC500]"
            placeholder="Ex: Deixar na portaria, tocar interfone 302..."
          ></textarea>
        </div>
      </div>
    </div>
  );
};
