import React from 'react';

interface PaymentOptionProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  descricao?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const PaymentOption: React.FC<PaymentOptionProps> = ({ id, icon, label, descricao, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-lg mb-2 border-2 transition-colors
        ${isSelected ? 'border-primaria bg-[color-mix(in_srgb,var(--cor-primaria)_12%,white)]' : 'border-borda bg-white'}`}
      onClick={() => onSelect(id)}
    >
      <span className="w-7 h-7 shrink-0 flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {descricao && <span className="block text-[12px] text-suave">{descricao}</span>}
      </span>
      <span
        className={`w-5 h-5 border-2 rounded-full shrink-0 flex items-center justify-center ${isSelected ? 'border-tinta' : 'border-[#BDBDBD]'}`}
        aria-hidden="true"
      >
        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-tinta" />}
      </span>
    </button>
  );
};
