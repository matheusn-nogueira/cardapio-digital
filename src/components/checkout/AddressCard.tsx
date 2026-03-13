import React from 'react';
import { MapPin } from 'lucide-react';

export const AddressCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 mb-3.5">
      <div className="flex items-start gap-3.5">
        <MapPin className="w-5 h-5 text-[#FFC500] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[15px] font-semibold mb-0.5">Avenida Pirpirituba, 532</div>
          <div className="text-[13px] text-[#696969]">Ponta Verde, Maceió - AL</div>
        </div>
        <button className="text-[13px] font-medium text-[#333] underline shrink-0 self-center hover:text-[#FFC500] transition-colors">
          Alterar
        </button>
      </div>
    </div>
  );
};
