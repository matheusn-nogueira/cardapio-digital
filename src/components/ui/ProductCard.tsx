import React from 'react';
import { Product } from '@/types';
import { Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  
  // Placeholder images based on category since we don't have real product images in repo
  const getImageUrl = (cat: string) => {
    switch(cat) {
      case 'cervejas': return 'https://images.unsplash.com/photo-1614316311657-19d2643a139a?w=200&fit=crop';
      case 'vinhos': return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&fit=crop';
      case 'salgadinhos': return 'https://images.unsplash.com/photo-1566478989037-eade17300b9e?w=200&fit=crop';
      case 'drinks': return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&fit=crop';
      default: return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&fit=crop';
    }
  };

  const handleAdd = () => {
    addItem(product);
  };

  return (
    <div className="bg-white rounded-2xl p-3 w-[140px] shrink-0 shadow-sm border border-gray-100 flex flex-col relative snap-start">
      <div className="w-full h-[120px] relative mb-3 bg-gray-50 rounded-xl overflow-hidden">
        <img 
          src={getImageUrl(product.category)} 
          alt={product.name} 
          className="w-full h-full object-cover mix-blend-multiply" 
        />
        <button 
          onClick={handleAdd}
          className="absolute -bottom-1 -right-1 bg-ze-yellow w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-black" strokeWidth={3} />
        </button>
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex flex-col mb-1">
          {product.oldPrice && (
            <span className="text-[11px] text-gray-400 line-through">
              R$ {product.oldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          <span className="text-[14px] font-bold text-black">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <span className="text-[12px] text-ze-green font-medium leading-tight line-clamp-2">
          {product.name}
        </span>
      </div>
    </div>
  );
};
