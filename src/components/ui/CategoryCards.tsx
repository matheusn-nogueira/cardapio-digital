import React from 'react';

export const CategoryCards: React.FC = () => {
  return (
    <section className="px-4 py-3 pb-5">
      <h2 className="text-gray-900 font-extrabold text-[15px] mb-3 uppercase tracking-wider">
        Vai de Quê Hoje?
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1 - Cervejas */}
        <div className="relative bg-white rounded-2xl p-4 h-36 overflow-hidden shadow-sm">
          <span className="text-[#333] font-bold text-[15px] z-10 relative leading-tight block w-2/3">Cervejas</span>
          <img 
            src="https://images.unsplash.com/photo-1614316311657-19d2643a139a?w=400&fit=crop" 
            alt="Cervejas" 
            className="absolute -bottom-6 -right-6 w-32 h-32 object-cover object-center rounded-3xl rotate-[-15deg] shadow-lg"
          />
        </div>
        
        {/* Card 2 - Não alcoólicos */}
        <div className="relative bg-white rounded-2xl p-4 h-36 overflow-hidden shadow-sm">
          <span className="text-[#333] font-bold text-[15px] z-10 relative leading-tight block w-2/3">Não alcoólicos</span>
          <img 
            src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&fit=crop" 
            alt="Não alcoólicos" 
            className="absolute -bottom-6 -right-6 w-32 h-32 object-cover object-center rounded-3xl rotate-12 shadow-lg"
          />
        </div>
      </div>
    </section>
  );
};
