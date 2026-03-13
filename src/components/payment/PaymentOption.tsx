import React from 'react';

interface PaymentOptionProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const PaymentOption: React.FC<PaymentOptionProps> = ({ id, icon, label, isSelected, onSelect }) => {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 bg-white rounded-lg cursor-pointer mb-2 border-2 transition-all duration-200 hover:shadow-[0_1px_6px_rgba(0,0,0,0.06)]
        ${isSelected ? 'border-[#FFC500]' : 'border-transparent'}`}
      onClick={() => onSelect(id)}
    >
      <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[20px]">
        {icon}
      </div>
      <span className="flex-1 text-[14px]">{label}</span>
      <div
        className={`w-5 h-5 border-2 rounded-full shrink-0 flex items-center justify-center transition-colors
          ${isSelected ? 'border-[#FFC500]' : 'border-[#ccc]'}`}
      >
        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FFC500]" />}
      </div>
    </div>
  );
};
