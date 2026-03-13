import type { Metadata } from 'next';
import { Roboto, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/context/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toast } from '@/components/ui/Toast';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const robotoCondensed = Roboto_Condensed({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cardápio Digital — Cervejas com Entrega Rápida',
  description: 'Clone funcional do Cardápio Digital com Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${roboto.variable} ${robotoCondensed.variable} scroll-smooth`}>
      <body className="font-roboto text-[16px] text-[#333] bg-white antialiased overflow-x-hidden">
        <AppProviders>
          <Header />
          {children}
          <Footer />
          <Toast />
        </AppProviders>
      </body>
    </html>
  );
}
