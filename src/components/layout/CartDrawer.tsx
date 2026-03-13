'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, subtotal, total, updateQty, removeItem } = useCart();
  const router = useRouter();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const beerSVG = (color: string, w = 40, h = 80) => (
    <svg viewBox="0 0 40 90" width={w} height={h} xmlns="http://www.w3.org/2000/svg">
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
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-[101] w-[380px] max-w-[100vw] bg-[#F5F5F5] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.12)] animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-center relative p-4 h-14 bg-white border-b border-[#eee] shrink-0">
          <span className="text-[15px] font-semibold uppercase tracking-wide">Sacola</span>
          <button
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[#696969] hover:bg-[#f0f0f0] transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-2 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-16 px-5 text-[#999]">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-[15px] font-medium mb-1 text-[#333]">Sua sacola está vazia</p>
              <p className="text-[13px]">Que tal colocar algumas bebidas para gelar?</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white border border-[#f5f5f5] rounded-xl p-3 mt-2.5 relative animate-slideIn">
                <div className="flex gap-2.5 items-start">
                  <div className="w-[60px] h-[60px] shrink-0 flex items-center justify-center">
                    {beerSVG(item.color, 30, 60)}
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className="text-[13px] text-[#999] leading-tight mb-1">{item.name}</h4>
                    <div className="flex items-center gap-1.5">
                      {item.oldPrice && (
                        <span className="text-[12px] text-[#999] line-through">
                          R$ {item.oldPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-[14px] font-semibold text-[#333]">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center justify-start gap-0 mt-2">
                      <button
                        className="w-[34px] h-[34px] flex items-center justify-center border border-[#eee] rounded-l-md bg-white text-[16px] text-[#333] hover:bg-[#f5f5f5] transition-colors"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >
                        -
                      </button>
                      <div className="w-[44px] h-[34px] flex items-center justify-center border-t border-b border-[#eee] bg-white text-[14px] font-medium">
                        {item.qty}
                      </div>
                      <button
                        className="w-[34px] h-[34px] flex items-center justify-center border border-[#eee] rounded-r-md bg-white text-[16px] text-[#333] hover:bg-[#f5f5f5] transition-colors"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#E53935] transition-colors"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-white p-4 shrink-0 border-t border-[#eee]">
          <div className="flex justify-between mb-1 text-[14px]">
            <span className="text-[#333]">Subtotal</span>
            <span className="text-[#333]">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between mb-1 text-[14px]">
            <span className="text-[#333]">Entrega</span>
            <span className="text-[#43A047] font-medium">Grátis</span>
          </div>
          <hr className="my-2 border-t border-[#eee]" />
          <div className="flex justify-between text-[16px] font-bold text-[#333]">
            <span>Total</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>

          <button
            className={`w-full mt-3.5 p-3.5 rounded-full text-[14px] font-bold uppercase tracking-wide transition-all ${
              items.length > 0
                ? 'bg-[#FFC500] text-[#333] hover:bg-[#e6b200] active:scale-95'
                : 'bg-[#ddd] text-[#999] cursor-not-allowed'
            }`}
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            Ir para o checkout
          </button>
        </div>
      </div>
    </>
  );
};
