import React from 'react';

interface PaymentOptionProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  descricao?: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const PaymentOption: React.FC<PaymentOptionProps> = ({ id, icon, label, descricao, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      className={`w-full min-h-16 text-left flex items-center gap-3.5 px-4 py-3 rounded-xl mb-2.5 border transition-colors
        ${isSelected ? 'border-tinta bg-tinta text-white' : 'border-borda bg-white text-tinta'}`}
      onClick={() => onSelect(id)}
    >
      {/* ícone num quadrado branco: as cores do Pix e do dinheiro valem nos dois estados */}
      <span className="w-10 h-10 shrink-0 rounded-lg bg-white flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[16px] font-bold leading-tight">{label}</span>
        {descricao && <span className={`block text-[13px] leading-snug mt-0.5 ${isSelected ? 'text-white/80' : 'text-suave'}`}>{descricao}</span>}
      </span>
      <span
        className={`w-5 h-5 border-2 rounded-full shrink-0 flex items-center justify-center ${isSelected ? 'border-white' : 'border-controle'}`}
        aria-hidden="true"
      >
        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
      </span>
    </button>
  );
};
