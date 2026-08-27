'use client';

import React from 'react';
import { CategoryCards } from '@/components/ui/CategoryCards';
import { CategoryIcons } from '@/components/ui/CategoryIcons';
import { PromoBanner, BrandGrid } from '@/components/ui/PromoBanner';
import { MobileProductShelf } from '@/components/ui/MobileProductShelf';
import { FloatingCart } from '@/components/ui/FloatingCart';
import { products } from '@/data/products';

export default function Home() {
  const topProducts = products.filter((p) => p.shelf === 'top');
  const ofertasProducts = products.filter((p) => p.shelf === 'ofertas');
  const craftProducts = products.filter((p) => p.shelf === 'craft');

  return (
    <main className="pb-28 bg-ze-gray min-h-screen">
      <CategoryCards />
      <CategoryIcons />
      <PromoBanner />
      
      <div className="bg-white pt-5 pb-2 mt-2 -mx-4 sm:mx-0">
        <MobileProductShelf
          title="Ofertas especiais"
          products={ofertasProducts}
        />
        <MobileProductShelf
          title="Mais vendidas"
          products={topProducts}
        />
        <MobileProductShelf
          title="Cervejas artesanais"
          products={craftProducts}
        />
      </div>

      <BrandGrid />
      
      <FloatingCart />
    </main>
  );
}

