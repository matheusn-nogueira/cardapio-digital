'use client';

import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-[#333] text-white">
      <div 
        className="bg-[#444] flex items-center justify-center gap-2 py-3 cursor-pointer text-[14px] hover:bg-[#555] transition-colors"
        onClick={scrollToTop}
      >
        ▲ Voltar ao topo
      </div>
      
      <div className="flex gap-9 py-9 px-6 max-w-[1100px] mx-auto flex-wrap md:flex-col md:px-4">
        {/* Logo */}
        <div className="w-[60px] h-[60px] shrink-0">
          <svg viewBox="0 0 54 54" fill="none">
            <circle cx="27" cy="27" r="27" fill="#FFC500" />
            <circle cx="18" cy="22" r="5" fill="#333" />
            <circle cx="36" cy="22" r="5" fill="#333" />
            <circle cx="18" cy="22" r="2" fill="#FFC500" />
            <circle cx="36" cy="22" r="2" fill="#FFC500" />
            <rect x="14" y="20" width="12" height="3" rx="1" fill="#333" />
            <rect x="30" y="20" width="12" height="3" rx="1" fill="#333" />
            <path d="M16 36 Q27 44 38 36" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <div className="min-w-[140px]">
          <h4 className="text-[15px] font-bold mb-2.5">Institucional</h4>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Sobre o Zé</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Trabalhe Conosco</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Imprensa</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Blog do Zé</a>
        </div>

        <div className="min-w-[140px]">
          <h4 className="text-[15px] font-bold mb-2.5">Ajuda</h4>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Central de Ajuda</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Fale Conosco</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Como Comprar</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Trocas e Devoluções</a>
        </div>

        <div className="min-w-[140px]">
          <h4 className="text-[15px] font-bold mb-2.5">Parceiros</h4>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Venda pelo Zé</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Seja um Entregador</a>
          <a href="#" className="block text-[13px] text-white mb-1.5 hover:opacity-80 transition-opacity">Programa de Afiliados</a>
        </div>

        <div>
          <h4 className="text-[15px] font-bold mb-2.5">Redes Sociais</h4>
          <div className="flex gap-3.5 mb-4">
            <Facebook className="w-6 h-6 hover:opacity-70 transition-opacity cursor-pointer fill-current" />
            <Instagram className="w-6 h-6 hover:opacity-70 transition-opacity cursor-pointer" />
            <Twitter className="w-6 h-6 hover:opacity-70 transition-opacity cursor-pointer fill-current" />
          </div>
          <a href="#" className="inline-block py-2.5 px-5 border border-white rounded-[4px] text-white text-[13px] font-bold hover:bg-white hover:text-[#333] transition-all">
            BAIXAR O APP
          </a>
        </div>
      </div>

      <div className="border-t border-[#555] py-3.5 px-6 flex items-center justify-between flex-wrap gap-2.5 text-[12px] text-[#aaa]">
        <div>
          <a href="#" className="text-white text-[13px] mr-4 hover:opacity-80 transition-opacity">Termos de Uso</a>
          <a href="#" className="text-white text-[13px] mr-4 hover:opacity-80 transition-opacity">Política de Privacidade</a>
        </div>
        <span className="flex-1 text-center">Beba com moderação. Venda proibida para menores de 18 anos. © 2025 Cardápio Digital.</span>
        <span>🔞 Venda proibida para menores</span>
      </div>
    </footer>
  );
};
