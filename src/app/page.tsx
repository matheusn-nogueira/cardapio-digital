'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { CategoryBar } from '@/components/store/CategoryBar';
import { BrandScroll } from '@/components/store/BrandScroll';
import { ExploreGrid } from '@/components/store/ExploreGrid';
import { ProductShelf } from '@/components/store/ProductShelf';
import { categories } from '@/data/categories';
import { products } from '@/data/products';
import { faqs } from '@/data/faqs';

export default function Home() {
  const [selectedCat, setSelectedCat] = useState('cervejas');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const currentCatLabel = categories.find((c) => c.id === selectedCat)?.label || '';
  const filteredProducts = products.filter((p) => p.category === selectedCat);

  const topProducts = filteredProducts.filter((p) => p.shelf === 'top');
  const ofertasProducts = filteredProducts.filter((p) => p.shelf === 'ofertas');
  const craftProducts = filteredProducts.filter((p) => p.shelf === 'craft');

  return (
    <main className="mt-[72px] pb-0 bg-white min-h-screen">
      <CategoryBar selectedCat={selectedCat} onSelect={setSelectedCat} />

      <div className="max-w-[1060px] mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="pt-4 text-[14px] text-[#696969] flex items-center gap-1.5 shrink-0 whitespace-nowrap overflow-hidden text-ellipsis">
          <Link href="/" className="hover:text-[#333] transition-colors">Página Inicial</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
          <span className="text-[#333] truncate max-w-[200px]">{currentCatLabel}</span>
        </nav>

        <h1 className="text-[28px] font-bold mt-2 mb-5 capitalize">{currentCatLabel}</h1>
        <hr className="border-t border-[#eee] my-2 mb-6" />

        <BrandScroll />
        <ExploreGrid />

        <hr className="border-t border-[#eee] my-2 mb-6" />

        <ProductShelf
          title="Mais vendidas"
          products={topProducts.length ? topProducts : filteredProducts.slice(0, 6)}
        />
        <ProductShelf
          title="Ofertas especiais"
          products={ofertasProducts}
        />
        <ProductShelf
          title="Cervejas artesanais"
          products={craftProducts}
        />

        <hr className="border-t border-[#eee] my-2 mb-6" />

        {/* FAQ Section */}
        <section className="py-7 border-t border-[#fafafa] bg-[#fafafa] -mx-4 px-4 sm:px-4">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-[22px] font-bold mb-4">Perguntas frequentes</h2>
            <div>
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="border border-[#e0e0e0] rounded-lg mb-2 overflow-hidden bg-white shadow-sm">
                    <button
                      className="flex items-center justify-between p-3.5 w-full text-left text-[15px] text-[#333] hover:bg-[#fafafa] transition-colors"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="font-medium pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#999] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[300px] opacity-100 pb-3.5 px-3.5' : 'max-h-0 opacity-0 px-3.5'
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed text-[#696969] border-t border-[#f5f5f5] pt-2 mt-1">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
