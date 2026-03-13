'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { AddressCard } from '@/components/checkout/AddressCard';
import { CouponCard } from '@/components/checkout/CouponCard';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { InstructionsCard } from '@/components/checkout/InstructionsCard';
import { ArrowLeft } from 'lucide-react';
import { LoginModal } from '@/components/ui/LoginModal';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!user) {
         setIsLoginOpen(true);
      } else if (items.length === 0) {
        router.push('/');
      }
    }
  }, [user, items.length, isMounted, router]);

  if (!isMounted) return null;

  return (
    <>
      <main className="mt-[72px] pb-10 bg-[#F5F5F5] min-h-[calc(100vh-72px)]">
        <div className="bg-white h-14 flex items-center justify-center relative border-b border-[#eee] px-4">
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#333] hover:bg-[#e0e0e0] transition-colors"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
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

        <div className="flex flex-col md:flex-row gap-6 p-6 max-w-[960px] mx-auto md:p-4">
          <div className="flex-1 md:max-w-full lg:max-w-[640px]">
             <h2 className="text-[20px] font-bold mb-4">Finalizar Pedido</h2>
             <AddressCard />
             <CouponCard />
             
             {/* Simple Items Review for Checkout Page */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 mb-3.5">
                <div className="flex items-start gap-3.5">
                  <span className="text-[20px] shrink-0 mt-0.5" role="img" aria-label="cart">🛒</span>
                  <div className="flex-1 w-full">
                    <div className="text-[15px] font-semibold mb-2.5">Itens do pedido</div>
                    <div className="space-y-3">
                       {items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-[14px]">
                             <span className="text-[#696969]"><span className="font-semibold text-[#333]">{item.qty}x</span> {item.name}</span>
                             <span className="font-semibold text-[#333]">R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                          </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

             <InstructionsCard />
             <button
               className="block w-fit mx-auto mt-6 py-3.5 px-11 bg-[#FFC500] text-[#333] text-[15px] font-semibold rounded-full hover:bg-[#e6b200] active:scale-[0.98] transition-all md:w-full md:text-center"
               onClick={() => router.push('/payment')}
             >
               Ir para pagamento
             </button>
          </div>
          
          <div className="w-[260px] shrink-0 md:w-full mt-8 md:mt-0">
             <OrderSummary />
          </div>
        </div>
      </main>
      
      {!user && (
         <LoginModal 
            isOpen={isLoginOpen} 
            onClose={() => {
                setIsLoginOpen(false);
                if (!user) { // If closed without login, go back to top
                    router.push('/');
                }
            }} 
         />
      )}
    </>
  );
}
