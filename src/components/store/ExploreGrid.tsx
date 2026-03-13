import React from 'react';

const exploreItems = [
  { label: 'Pilsen', bg: 'linear-gradient(135deg,#FFC107,#FF9800)' },
  { label: 'IPA', bg: 'linear-gradient(135deg,#5D4037,#8D6E63)' },
  { label: 'Lager', bg: 'linear-gradient(135deg,#F44336,#E91E63)' },
  { label: 'Puro Malte', bg: 'linear-gradient(135deg,#212121,#616161)' },
  { label: 'Weiss', bg: 'linear-gradient(135deg,#FF6F00,#FFA000)' },
  { label: 'Long Neck', bg: 'linear-gradient(135deg,#1B5E20,#4CAF50)' },
];

export const ExploreGrid: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-[20px] font-medium mb-3.5">EXPLORAR CATEGORIA</h2>
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#FFC500] scrollbar-track-transparent">
        {exploreItems.map((e, i) => (
          <div
            key={i}
            className="shrink-0 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div
              className="w-[180px] h-[90px] rounded-lg flex items-center justify-center mb-1.5"
              style={{ background: e.bg }}
            >
              <span className="text-white font-bold text-[14px]">{e.label}</span>
            </div>
            <span className="text-[13px] text-[#333]">{e.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
