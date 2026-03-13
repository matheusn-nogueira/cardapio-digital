import React from 'react';

interface BadgeProps {
  count: number;
}

export const Badge: React.FC<BadgeProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-2 bg-[#FFC500] text-[#333] text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center transition-transform duration-200 animate-pulse-badge">
      {count}
    </span>
  );
};
