'use client';

import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { toastEvent } from '../ui/Toast';

export const CouponCard: React.FC = () => {
  const [coupon, setCoupon] = useState('');

  const applyCoupon = () => {
    if (coupon.trim() === '') return;
    toastEvent.show('Cupom aplicado com sucesso!');
    setCoupon('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 mb-3.5">
      <div className="flex items-start gap-3.5">
        <Tag className="w-5 h-5 text-[#FFC500] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[15px] font-semibold mb-0.5">Cupom de desconto</div>
          <div className="text-[13px] text-[#696969]">Insira seu código promocional</div>
          <div className="flex gap-2 mt-2.5">
            <input
              type="text"
              placeholder="Código do cupom"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1 px-3.5 py-2.5 border border-[#eee] rounded-lg text-[14px] outline-none focus:border-[#FFC500]"
            />
            <button
              className="px-4.5 py-2.5 bg-[#333] text-white text-[13px] font-semibold rounded-lg hover:bg-[#555] transition-colors"
              onClick={applyCoupon}
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
