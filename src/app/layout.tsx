import type { Metadata } from "next";
import { Roboto, Playfair_Display, Belleza } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../lib/context";
import ClientSearchProvider from "../components/providers/ClientSearchProvider";
import ServiceWorkerProvider from "../components/providers/ServiceWorkerProvider";
import { SWRProvider } from "../components/providers/SWRProvider";
import { ChatProvider } from "../lib/chat-context";
import StructuredData from "../components/seo/StructuredData";
import ConditionalLayout from "../components/layout/ConditionalLayout";
import GoogleAnalytics from "../components/analytics/GoogleAnalytics";
import MetaPixel from "../components/analytics/MetaPixel";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // reduced weights to shrink font payload
  display: 'swap',
  preload: true,
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // reduced weights to shrink font payload
  display: 'swap',
  preload: true,
});

const belleza = Belleza({
  variable: "--font-belleza",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Scarlet - Premium Beauty & Skincare Store",
    template: "%s | Scarlet"
  },
    description: "Discover the finest collection of beauty and skincare products at Scarlet. From K-beauty essentials to premium international brands.",
  keywords: [
    "beauty",
    "skincare", 
    "makeup",
    "cosmetics",
    "K-beauty",
    "premium beauty",
    "Bangladesh",
    "Dhaka",
    "online beauty store",
    "beauty products",
    "skincare routine",
    "makeup tutorial",
    "beauty tips"
  ],
  authors: [{ name: "Scarlet Team" }],
  creator: "Scarlet",
  publisher: "Scarlet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://scarletunlimited.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Scarlet',
    title: 'Scarlet - Premium Beauty & Skincare Store',
    description: 'Discover the finest collection of beauty and skincare products at Scarlet. From K-beauty essentials to premium international brands.',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Scarlet - Premium Beauty & Skincare Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ScarletBeauty',
    creator: '@ScarletBeauty',
    title: 'Scarlet - Premium Beauty & Skincare Store',
    description: 'Discover the finest collection of beauty and skincare products at Scarlet. From K-beauty essentials to premium international brands.',
    images: ['/images/og-home.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
verification: {
    google: process.env['NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION'],
    yandex: process.env['NEXT_PUBLIC_YANDEX_VERIFICATION'],
    yahoo: process.env['NEXT_PUBLIC_BING_SITE_VERIFICATION'],
    other: {
      'facebook-domain-verification': ['bueaabyph4rrii8jn1ov4qqy7osav1'],
    },
  },
  other: {
    'fb:app_id': process.env['NEXT_PUBLIC_FACEBOOK_APP_ID'] || '',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#dc2626" />
<meta name="facebook-domain-verification" content="bueaabyph4rrii8jn1ov4qqy7osav1" />        
        <StructuredData type="organization" />
        <StructuredData type="localBusiness" />
      </head>
      <body
        className={`${roboto.variable} ${playfairDisplay.variable} ${belleza.variable} antialiased h-full`}
      >
        <GoogleAnalytics />
        <MetaPixel />
        <SWRProvider>
          <AppProvider>
            <ClientSearchProvider>
              <ChatProvider>
                <ServiceWorkerProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                </ServiceWorkerProvider>
              </ChatProvider>
            </ClientSearchProvider>
          </AppProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
