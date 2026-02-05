import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider, ReactQueryProvider } from '@/providers';
import ClientOnlyFeatures from '@/components/ClientOnlyFeatures';
import { SITE_NAME, SITE_DESCRIPTION } from '@/core';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  viewport: 'width=device-width, initial-scale=1',
  metadataBase: new URL('https://metroflow.vercel.app'),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: 'https://metroflow.vercel.app',
    siteName: SITE_NAME,
    images: [
      {
        url: '/og-image.png',
        width: 800,
        height: 600,
        alt: 'MetroFlow OpenGraph Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    'Berlin',
    'public transport',
    'departures',
    'real-time',
    'VBB',
    'S-Bahn',
    'U-Bahn',
    'transit',
  ],
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="theme-color" content="#1d4ed8" />
        </head>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-50 transition-colors`}
        >
          <ThemeProvider>
            <ReactQueryProvider>
              {/* Client-only features (shortcuts, listeners) */}
              <ClientOnlyFeatures />
              <Header />
              <ErrorBoundary>
                <main className="flex-1">{children}</main>
              </ErrorBoundary>
              <Footer />
            </ReactQueryProvider>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </Providers>
  );
}
