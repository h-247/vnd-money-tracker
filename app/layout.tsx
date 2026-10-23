import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VND Money Tracker — Personal Financial Bookkeeping',
  description:
    'Simple, fast, reliable web application for tracking money in Vietnamese Dong (VND).',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#212121',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} font-sans bg-[#212121] text-[#ECECEC] min-h-screen antialiased selection:bg-zinc-700 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
