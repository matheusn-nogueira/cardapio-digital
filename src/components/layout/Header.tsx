'use client';

import React from 'react';
import { Search } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-ze-gray pt-4 pb-2 px-4 sticky top-0 z-40">
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          className="w-full py-3.5 pr-4 pl-11 rounded-2xl bg-white text-[15px] font-medium text-[#333] shadow-sm border-none outline-none placeholder:text-gray-400 placeholder:font-normal"
          placeholder="Busque por Chopp"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        <span className="shrink-0 bg-white border border-gray-100 text-ze-green font-bold text-[13px] px-3.5 py-1.5 rounded-full shadow-sm">
          R$40 OFF
        </span>
        <span className="shrink-0 bg-white border border-gray-100 text-ze-green font-bold text-[13px] px-3.5 py-1.5 rounded-full shadow-sm">
          30% OFF
        </span>
        <span className="shrink-0 bg-white border border-gray-100 text-ze-green font-bold text-[13px] px-3.5 py-1.5 rounded-full shadow-sm">
          Frete grátis
        </span>
        <span className="shrink-0 bg-white border border-gray-100 text-ze-green font-bold text-[13px] px-3.5 py-1.5 rounded-full shadow-sm">
          R$15 OFF
        </span>
      </div>
    </header>
  );
};
