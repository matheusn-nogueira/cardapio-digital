'use client';

import React, { useEffect, useState } from 'react';

// Um simples evento global para disparar toasts sem precisar de Context pra tudo
export const toastEvent = {
  show: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: message }));
    }
  },
};

export const Toast: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setMessage(customEvent.detail);
      setIsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsVisible(false), 2500);
    };

    window.addEventListener('show-toast', handleToast);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('show-toast', handleToast);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] max-w-[calc(100vw-32px)] bg-tinta text-white py-3 px-5 rounded-xl text-[14px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 pointer-events-none text-center
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[80px] opacity-0'}`}
    >
      {message}
    </div>
  );
};
