import type { Metadata } from 'next';
import { Inter, Padauk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const padauk = Padauk({ subsets: ['myanmar', 'latin'], weight: ['400', '700'], variable: '--font-padauk' });

export const metadata: Metadata = {
  title: { default: 'CHILL MALL | Premium AI Video Streaming', template: '%s | CHILL MALL' },
  description: 'Stream curated AI animations, short films, sci-fi, and experimental cinema in English and Myanmar.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${inter.variable} ${padauk.variable}`}>
      <body className="min-h-screen bg-bg-main text-slate-100 antialiased selection:bg-violet-600/40">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
