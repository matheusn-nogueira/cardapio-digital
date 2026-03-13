import React from 'react';
import { brands } from '@/data/brands';

export const BrandScroll: React.FC = () => {
  return (
    <section className="mb-7">
      <h2 className="text-[20px] font-medium mb-3">GRANDES MARCAS</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#FFC500] scrollbar-track-transparent">
        {brands.map((b, i) => (
          <div
            key={i}
            className="shrink-0 w-[112px] h-[124px] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            style={{ background: b.bg }}
          >
            <span
              className="font-bold text-center whitespace-pre-line"
              style={{ color: b.color, fontSize: b.size || '16px' }}
              dangerouslySetInnerHTML={{ __html: b.name.replace('\n', '<br/>') }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
