'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (name && email && pass) {
        register(name, email, pass);
        onClose();
      }
    } else {
      if (email && pass) {
        login(email, pass);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center animate-modalIn">
      <div className="bg-white rounded-2xl p-8 w-[380px] max-w-[90vw] relative">
        <button className="absolute top-3 right-3 text-[#999] hover:text-[#333] transition-colors" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-[20px] font-bold mb-1.5">{isRegister ? 'Criar Conta' : 'Entrar'}</h2>
        <p className="text-[14px] text-[#696969] mb-5">
          {isRegister ? 'Preencha seus dados para se cadastrar' : 'Acesse sua conta para fazer pedidos'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegister && (
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#eee] rounded-lg text-[14px] outline-none focus:border-[#FFC500]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#333] mb-1">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#eee] rounded-lg text-[14px] outline-none focus:border-[#FFC500]"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#333] mb-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#eee] rounded-lg text-[14px] outline-none focus:border-[#FFC500]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#FFC500] text-[#333] text-[15px] font-semibold rounded-full hover:bg-[#e6b200] transition-colors mt-1.5"
          >
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-3.5 text-[13px] text-[#696969]">
          {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
          <button
            className="text-[#FFC500] font-medium hover:underline focus:outline-none"
            onClick={() => setIsRegister(!isRegister)}
            type="button"
          >
            {isRegister ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  );
};
