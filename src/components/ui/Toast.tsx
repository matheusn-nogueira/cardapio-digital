'use client';

import React, { useEffect, useState } from 'react';

// Um simples evento global para disparar toasts sem precisar de Context pra tudo
export const toastEvent = {
  show: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: message }));
    }
  }
};

export const Toast: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setMessage(customEvent.detail);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-[#333] text-white py-3 px-6 rounded-md text-[14px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 pointer-events-none
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[80px] opacity-0'}`}
    >
      {message}
    </div>
  );
};
