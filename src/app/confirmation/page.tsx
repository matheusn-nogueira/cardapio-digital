'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function ConfirmationPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderNum, setOrderNum] = useState<string | null>(null);

  useEffect(() => {
    // Pegar n do pedido e limpar carrinho
    const lastOrder = sessionStorage.getItem('zeLastOrder') || '000000';
    setOrderNum(lastOrder);
    
    // Pequeno atraso para não ver o carrinho esvaziando durante a transição
    const timer = setTimeout(() => {
        clearCart();
    }, 500);

    return () => clearTimeout(timer);
  }, [clearCart]);

  if (!orderNum) return null;

  return (
    <main className="mt-[72px] bg-[#F5F5F5] min-h-[calc(100vh-72px)] flex flex-col">
      <div className="bg-white h-14 flex items-center justify-center relative border-b border-[#eee] px-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 44 44" width="32" height="32" fill="none">
            <circle cx="22" cy="22" r="22" fill="#FFC500" />
            <circle cx="15" cy="18" r="4" fill="#333" />
            <circle cx="29" cy="18" r="4" fill="#333" />
            <circle cx="15" cy="18" r="1.5" fill="#FFC500" />
            <circle cx="29" cy="18" r="1.5" fill="#FFC500" />
            <rect x="11" y="16" width="10" height="2.5" rx="1" fill="#333" />
            <rect x="24" y="16" width="10" height="2.5" rx="1" fill="#333" />
            <path d="M13 30 Q22 37 31 30" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <span className="text-[18px] font-bold text-[#333] italic">Cardápio Digital</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pb-20 max-w-[500px] mx-auto animate-fadeIn">
        <div className="text-[64px] mb-4">🎉</div>
        <h2 className="text-[24px] font-bold mb-2">Pedido Confirmado!</h2>
        <p className="text-[15px] text-[#696969] mb-1.5">Seu pedido foi realizado com sucesso.</p>
        <p className="text-[14px] text-[#999] mb-6">Pedido #{orderNum}</p>
        
        <div className="inline-flex items-center gap-2 py-3 px-6 bg-[#E8F5E9] rounded-lg text-[15px] font-semibold text-[#43A047] mb-8">
          <span role="img" aria-label="motoboy">🛵</span> Estimativa de entrega: 35–50 min
        </div>
        
        <button
          className="py-3.5 px-11 bg-[#FFC500] text-[#333] text-[15px] font-semibold rounded-full hover:bg-[#e6b200] transition-colors w-full max-w-[300px]"
          onClick={() => {
            sessionStorage.removeItem('zeLastOrder');
            router.push('/');
          }}
        >
          Fazer novo pedido
        </button>
      </div>
    </main>
  );
}
