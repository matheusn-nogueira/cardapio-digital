import React from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductShelfProps {
  title: string;
  products: Product[];
}

export const ProductShelf: React.FC<ProductShelfProps> = ({ title, products }) => {
  if (products.length === 0) return null;

  return (
    <section className="mb-7">
      <h3 className="text-[13px] font-normal text-[#999] uppercase tracking-wide mb-2.5">
        {title}
      </h3>
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#FFC500] scrollbar-track-transparent">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
