import React from 'react';

interface BadgeProps {
  count: number;
}

export const Badge: React.FC<BadgeProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 bg-tinta text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
