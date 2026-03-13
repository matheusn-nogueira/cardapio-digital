'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Search, ChevronDown, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoginModal } from '@/components/ui/LoginModal';
import { CartDrawer } from './CartDrawer';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#333] h-[72px] flex items-center justify-between px-6 transition-all duration-300 md:px-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-11 h-11 shrink-0 cursor-pointer md:w-9 md:h-9">
            <svg viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="22" fill="#FFC500" />
              <circle cx="15" cy="18" r="4" fill="#333" />
              <circle cx="29" cy="18" r="4" fill="#333" />
              <circle cx="15" cy="18" r="1.5" fill="#FFC500" />
              <circle cx="29" cy="18" r="1.5" fill="#FFC500" />
              <rect x="11" y="16" width="10" height="2.5" rx="1" fill="#333" />
              <rect x="24" y="16" width="10" height="2.5" rx="1" fill="#333" />
              <path d="M13 30 Q22 37 31 30" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-[13px] text-white">Por favor</span>
              <span className="text-[13px] text-[#FFC500] font-medium">Informar sua localização</span>
            </div>
            <ChevronDown className="text-white w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 max-w-[400px] mx-6 relative md:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] w-4 h-4 pointer-events-none" />
          <input
            type="text"
            className="w-full py-2.5 pr-4 pl-10 rounded-full border border-[#555] bg-white text-[14px] text-[#333] outline-none focus:border-[#FFC500]"
            placeholder="Pesquise sua bebida favorita"
          />
        </div>

        <div className="flex items-center gap-4">
          <div id="userArea">
            {user ? (
              <div className="flex items-center gap-2 cursor-pointer text-white">
                <div className="w-8 h-8 rounded-full bg-[#FFC500] flex items-center justify-center font-bold text-[14px] text-[#333]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col hidden md:flex">
                  <span className="text-[13px] font-medium text-white">{user.name}</span>
                </div>
              </div>
            ) : (
              <button
                className="bg-white text-[#333] text-[14px] font-medium py-2 px-6 rounded-full hover:bg-[#f0f0f0] transition-colors"
                onClick={() => setIsLoginOpen(true)}
              >
                Entrar
              </button>
            )}
          </div>
          <button
            className="relative p-1"
            onClick={() => setIsCartOpen(true)}
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="w-[26px] h-[26px] text-white" />
            <Badge count={itemCount} />
          </button>
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
