'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, CreditCard, Zap, HandCoins } from 'lucide-react';
import { PaymentTabs } from '@/components/payment/PaymentTabs';
import { PaymentOption } from '@/components/payment/PaymentOption';
import { OrderSummary } from '@/components/checkout/OrderSummary';

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('credit');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!user || items.length === 0) {
        router.push('/');
      }
    }
  }, [user, items.length, isMounted, router]);

  if (!isMounted || !user || items.length === 0) return null;

  const handleConfirmOrder = () => {
    // Generate a random order number for the demo
    const orderNum = Math.floor(Math.random() * 900000) + 100000;
    sessionStorage.setItem('zeLastOrder', orderNum.toString());
    router.push('/confirmation');
  };

  return (
    <main className="mt-[72px] pb-10 bg-[#F5F5F5] min-h-[calc(100vh-72px)]">
      <div className="bg-white h-14 flex items-center justify-center relative border-b border-[#eee] px-4">
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#333] hover:bg-[#e0e0e0] transition-colors"
          onClick={() => router.push('/checkout')}
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
          <h2 className="text-[20px] font-bold mb-4">Pagamento</h2>
          <PaymentTabs activeTab={activeTab} onSelect={(idx) => {
            setActiveTab(idx);
            setSelectedMethod(idx === 0 ? 'credit' : 'cash');
          }} />

          {activeTab === 0 && (
            <div className="animate-fadeIn">
              <p className="text-[15px] font-bold mb-2.5 mt-2">Cartão de crédito</p>
              <PaymentOption
                id="credit"
                label="Cartão de crédito"
                icon={<CreditCard className="w-5 h-5" />}
                isSelected={selectedMethod === 'credit'}
                onSelect={setSelectedMethod}
              />
              <p className="text-[15px] font-bold mb-2.5 mt-4">Pix</p>
              <PaymentOption
                id="pix"
                label="Pix — Aprovação instantânea"
                icon={<Zap className="w-5 h-5 text-green-600" />}
                isSelected={selectedMethod === 'pix'}
                onSelect={setSelectedMethod}
              />
            </div>
          )}

          {activeTab === 1 && (
            <div className="animate-fadeIn">
              <p className="text-[15px] font-bold mb-2.5 mt-2">Na entrega</p>
              <PaymentOption
                id="cash"
                label="Dinheiro"
                icon={<HandCoins className="w-5 h-5 text-green-700" />}
                isSelected={selectedMethod === 'cash'}
                onSelect={setSelectedMethod}
              />
              <PaymentOption
                id="card_delivery"
                label="Cartão na entrega (débito/crédito)"
                icon={<CreditCard className="w-5 h-5" />}
                isSelected={selectedMethod === 'card_delivery'}
                onSelect={setSelectedMethod}
              />
            </div>
          )}

          <button
            className="block w-fit mx-auto mt-6 py-3.5 px-11 bg-[#FFC500] text-[#333] text-[15px] font-semibold rounded-full hover:bg-[#e6b200] active:scale-[0.98] transition-all md:w-full md:text-center"
            onClick={handleConfirmOrder}
          >
            Confirmar Pedido
          </button>
        </div>

        <div className="w-[260px] shrink-0 md:w-full mt-8 md:mt-0">
          <OrderSummary />
        </div>
      </div>
    </main>
  );
}
