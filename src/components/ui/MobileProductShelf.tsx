import React from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface MobileProductShelfProps {
  title: string;
  products: Product[];
}

export const MobileProductShelf: React.FC<MobileProductShelfProps> = ({ title, products }) => {
  if (!products.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[16px] font-bold text-[#333] tracking-tight">{title}</h2>
        <button className="text-[13px] text-ze-green font-bold uppercase tracking-wider">Ver todos</button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
