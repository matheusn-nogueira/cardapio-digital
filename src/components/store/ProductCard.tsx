'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { Plus } from 'lucide-react';
import { toastEvent } from '../ui/Toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const disc = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toastEvent.show(`${product.name} adicionado!`);
  };

  const beerSVG = (color: string) => (
    <svg viewBox="0 0 40 90" width="40" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="2" width="10" height="14" rx="2" fill="#888" />
      <rect x="14" y="14" width="12" height="4" rx="1" fill="#aaa" />
      <path d="M14 18 L12 30 L12 80 Q12 86 16 86 L24 86 Q28 86 28 80 L28 30 L26 18 Z" fill={color} />
      <rect x="10" y="38" width="20" height="18" rx="2" fill="#fff" opacity="0.85" />
      <rect x="12" y="42" width="16" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="14" y="46" width="12" height="1.5" rx="0.75" fill={color} opacity="0.4" />
      <rect x="13" y="50" width="14" height="1.5" rx="0.75" fill={color} opacity="0.3" />
    </svg>
  );

  return (
    <div
      className="shrink-0 w-[175px] bg-white border border-[#eee] rounded-lg overflow-hidden cursor-pointer relative transition-all duration-[150ms] hover:-translate-y-[1px] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] sm:w-[150px]"
      onClick={handleAdd}
    >
      {disc > 0 && (
        <span className="absolute top-1.5 left-1.5 bg-[#E53935] text-white text-[10px] font-semibold py-0.5 px-1.5 rounded-[4px]">
          -{disc}%
        </span>
      )}
      <div className="w-full h-[105px] flex items-center justify-center p-2 bg-[#fafafa]">
        {beerSVG(product.color)}
      </div>
      <hr className="border-t border-[#f0f0f0] my-0" />
      <div className="p-2 pb-10 relative h-[86px]">
        <span className="text-[13px] text-[#999] leading-[1.25] max-h-8 overflow-hidden block line-clamp-2">
          {product.name}
        </span>
        <div className="flex flex-col mt-0.5">
          {product.oldPrice ? (
            <span className="text-[11px] text-[#999] line-through">
              R$ {product.oldPrice.toFixed(2).replace('.', ',')}
            </span>
          ) : (
             <span className="text-[11px] text-transparent select-none">&nbsp;</span>
          )}
          <span className="text-[14px] font-bold text-[#333]">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
      
      <button
        className="absolute bottom-2 right-2 w-7 h-7 bg-[#FFC500] rounded-full flex items-center justify-center text-[18px] font-bold text-[#333] transition-all duration-[150ms] hover:scale-110 hover:bg-[#e6b200]"
        onClick={handleAdd}
      >
        <Plus className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
};
