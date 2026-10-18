import type { Metadata, Viewport } from 'next';
import { Roboto, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/context/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FloatingCart } from '@/components/ui/FloatingCart';
import { Toast } from '@/components/ui/Toast';
import { ProdutoModal } from '@/components/loja/ProdutoModal';
import { ConfirmacaoIdade } from '@/components/loja/ConfirmacaoIdade';
import { buscarHome, buscarProdutos } from '@/lib/cardapio';
import { corSegura } from '@/lib/formatacao';
import { descreverStatus } from '@/lib/horarios';
import { DESCRICAO_SITE, URL_SITE } from '@/lib/site';

const roboto = Roboto({
  weight: ['400', '500', '700', '900'],
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

export async function generateMetadata(): Promise<Metadata> {
  const { loja, config } = await buscarHome();
  const nome = loja.nome || 'Casa dos Fundos';
  const descricao = DESCRICAO_SITE;
  // prévia no WhatsApp/redes: logo da loja (Storage do Supabase, URL absoluta)
  const imagens = loja.logo_url ? [{ url: loja.logo_url, alt: nome }] : undefined;
  return {
    metadataBase: new URL(URL_SITE),
    title: { default: `${nome} — ${config.slogan}`, template: `%s · ${nome}` },
    description: descricao,
    applicationName: nome,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: '/',
      siteName: nome,
      title: nome,
      description: descricao,
      images: imagens,
    },
    twitter: { card: 'summary', title: nome, description: descricao, images: loja.logo_url ? [loja.logo_url] : undefined },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { config } = await buscarHome();
  return { themeColor: corSegura(config.cor_primaria, '#F2B705') };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [home, produtos] = await Promise.all([buscarHome(), buscarProdutos()]);
  const status = descreverStatus(home.aberta, home.config, home.horarios);
  const tema = {
    '--cor-primaria': corSegura(home.config.cor_primaria, '#F2B705'),
    '--cor-texto-primaria': corSegura(home.config.cor_texto_primaria, '#1A1A1A'),
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" className={`${roboto.variable} ${robotoCondensed.variable} scroll-smooth`} style={tema}>
      <body className="font-sans text-[16px] text-tinta bg-fundo antialiased overflow-x-hidden">
        <AppProviders home={home} status={status} produtos={produtos}>
          <Header />
          {children}
          <Footer />
          <FloatingCart />
          <CartDrawer />
          <ProdutoModal />
          <ConfirmacaoIdade />
          <Toast />
        </AppProviders>
      </body>
    </html>
  );
}
