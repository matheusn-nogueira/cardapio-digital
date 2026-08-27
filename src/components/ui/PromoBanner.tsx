import React from 'react';

export const PromoBanner: React.FC = () => {
  return (
    <section className="px-4 py-2 mb-2">
      <div className="bg-[#001a4d] rounded-2xl p-4 flex items-center justify-between relative overflow-hidden shadow-sm h-32 cursor-pointer">
        <div className="z-10 w-2/3">
          <span className="text-[#FFCC00] font-bold text-[12px] uppercase tracking-wider block mb-1">
            Semana do Consumidor
          </span>
          <h2 className="text-white font-extrabold text-[18px] leading-tight">
            CHOPP POR ATÉ 15% OFF
          </h2>
        </div>
        <img
          src="https://images.unsplash.com/photo-1575037614876-c385ec814cba?w=400&fit=crop"
          alt="Chopp em oferta"
          className="absolute -right-4 top-0 h-full w-2/5 object-cover object-center mix-blend-screen opacity-90"
        />
      </div>
    </section>
  );
};

export const BrandGrid: React.FC = () => {
  const brands = ['Brahma', 'Skol', 'Corona', 'Spaten', 'Stella Artois', 'Budweiser', 'Antarctica', 'Original'];
  
  return (
    <section className="px-4 py-4 mb-4 bg-white mt-2">
      <h2 className="text-[16px] font-bold text-[#333] tracking-tight mb-4">Marcas que amamos</h2>
      <div className="grid grid-cols-4 gap-3">
        {brands.map((brand, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer">
            <div className="w-16 h-16 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center p-2 bg-white">
              <span className="text-[10px] font-bold text-center text-gray-400 break-words">{brand}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
