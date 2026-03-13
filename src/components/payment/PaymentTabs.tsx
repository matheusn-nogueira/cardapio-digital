import React from 'react';

interface PaymentTabsProps {
  activeTab: number;
  onSelect: (index: number) => void;
}

export const PaymentTabs: React.FC<PaymentTabsProps> = ({ activeTab, onSelect }) => {
  return (
    <div className="flex gap-0 mb-3.5 border-b-2 border-[#eee]">
      <button
        className={`px-0 py-2.5 mr-7 text-[15px] font-semibold border-b-[3px] -mb-0.5 transition-all
          ${activeTab === 0 ? 'border-[#333] text-[#333]' : 'border-transparent text-[#696969] hover:text-[#333]'}`}
        onClick={() => onSelect(0)}
      >
        Pague online
      </button>
      <button
        className={`px-0 py-2.5 mr-7 text-[15px] font-semibold border-b-[3px] -mb-0.5 transition-all
          ${activeTab === 1 ? 'border-[#333] text-[#333]' : 'border-transparent text-[#696969] hover:text-[#333]'}`}
        onClick={() => onSelect(1)}
      >
        Na entrega
      </button>
    </div>
  );
};
