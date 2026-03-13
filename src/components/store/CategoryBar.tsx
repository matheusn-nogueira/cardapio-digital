'use client';

import React from 'react';
import { categories } from '@/data/categories';

interface CategoryBarProps {
  selectedCat: string;
  onSelect: (id: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ selectedCat, onSelect }) => {
  return (
    <section className="bg-white py-3 border-b border-[#eee] overflow-x-auto custom-scrollbar">
      <div className="flex gap-0 max-w-[1060px] mx-auto px-4 flex-nowrap md:flex-wrap">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col items-center w-[calc(100%/8)] min-w-[80px] md:w-[calc(100%/4)] sm:w-[calc(100%/2)] p-2 cursor-pointer border-2 rounded-lg transition-all duration-200 hover:opacity-80
              ${c.id === selectedCat ? 'border-[#FFC500] font-bold' : 'border-transparent'}`}
            onClick={() => onSelect(c.id)}
          >
            <div
              className="w-16 h-16 bg-[#F5F5F5] rounded-lg flex items-center justify-center mb-1.5 text-[28px] sm:w-[50px] sm:h-[50px] sm:text-[22px]"
              style={{ background: c.bg }}
            >
              {c.icon === '%' ? <b style={{ fontSize: '22px', color: '#D4A200' }}>%</b> : c.icon}
            </div>
            <span className="text-[12px] text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
