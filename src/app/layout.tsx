import type { Metadata, Viewport } from 'next';
import { imagensDeAbertura } from '@/lib/abertura';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/context/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FloatingCart } from '@/components/ui/FloatingCart';
import { BarraInferior } from '@/components/layout/BarraInferior';
import { ConvitePush } from '@/components/ui/ConvitePush';
import { Toast } from '@/components/ui/Toast';
import { FocoNasFolhas } from '@/components/ui/FocoNasFolhas';
import { ProdutoModal } from '@/components/loja/ProdutoModal';
import { ConfirmacaoIdade } from '@/components/loja/ConfirmacaoIdade';
import { buscarEsgotados, buscarHome, buscarProdutos } from '@/lib/cardapio';
import { corSegura } from '@/lib/formatacao';
import { descreverStatus } from '@/lib/horarios';
import { DESCRICAO_SITE, URL_SITE } from '@/lib/site';

// Freezer (27/10/2026): Barlow no texto, Barlow Condensed nos títulos e preços, como etiqueta de freezer
const roboto = Barlow({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const robotoCondensed = Barlow_Condensed({
  weight: ['600', '700', '800'],
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
    // abertura do app instalado no iPhone: azul-noite com a logo (src/lib/abertura.ts)
    appleWebApp: { capable: true, title: nome, startupImage: imagensDeAbertura() },
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

// Freezer: a barra do navegador acompanha o topo azul-noite (antes, a cor do banco)
export const viewport: Viewport = { themeColor: '#0A2540' };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [home, produtos, esgotados] = await Promise.all([buscarHome(), buscarProdutos(), buscarEsgotados()]);
  const status = descreverStatus(home.aberta, home.config, home.horarios);
  const tema = {
    '--cor-primaria': corSegura(home.config.cor_primaria, '#F2B705'),
    '--cor-texto-primaria': corSegura(home.config.cor_texto_primaria, '#1A1A1A'),
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" className={`${roboto.variable} ${robotoCondensed.variable} scroll-smooth`} style={tema}>
      <body className="font-sans text-[16px] text-tinta bg-fundo antialiased">
        <AppProviders home={home} status={status} produtos={produtos} esgotados={esgotados}>
          <Header />
          {children}
          <Footer />
          <FloatingCart />
          <BarraInferior />
          <ConvitePush />
          <CartDrawer />
          <ProdutoModal />
          <ConfirmacaoIdade />
          <Toast />
          <FocoNasFolhas />
        </AppProviders>
      </body>
    </html>
  );
}
