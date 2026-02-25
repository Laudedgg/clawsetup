import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0d12',
};

export const metadata: Metadata = {
  title: 'ClawSetup - Deploy OpenClaw in Minutes',
  description: 'Simplified OpenClaw deployment with managed infrastructure and support. From guided self-install to fully managed hosting.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ClawSetup',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} ${inter.className}`}>
        <Providers>
          <div className="bg-app">
            <Navbar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
