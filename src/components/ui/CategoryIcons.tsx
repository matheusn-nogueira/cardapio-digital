import React from 'react';
import { categories } from '@/data/categories';

export const CategoryIcons: React.FC = () => {
  return (
    <section className="py-2 pb-5 bg-white mb-2 pt-4 rounded-b-xl shadow-sm">
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
        {categories.slice(0, 10).map((cat) => (
          <div key={cat.id} className="flex flex-col items-center gap-2 shrink-0 w-[72px] cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-[60px] h-[60px] rounded-full bg-ze-gray shadow-sm border border-gray-100 flex items-center justify-center text-2xl">
              {cat.icon}
            </div>
            <span className="text-[12px] text-[#333] font-medium text-center leading-tight">
              {cat.label}
            </span>
          </div>
        ))}
      </div>
      {/* Dots indicator mock */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <div className="w-4 h-1.5 rounded-full bg-gray-400"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
      </div>
    </section>
  );
};
