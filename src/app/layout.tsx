import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import Providers from '@/app/Providers';
import Sidebar from '@/components/Sidebar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AskMyPDF',
  description: 'Chat with your PDFs',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-page text-fg flex h-full">
        <Providers>
          {/* Sidebar reads usePathname(), which is runtime data on dynamic
              routes, so it must sit behind Suspense for Cache Components. The
              fallback reserves the sidebar's width to avoid a layout shift. */}
          <Suspense
            fallback={
              <aside className="bg-sidebar border-border w-65 min-w-65 border-r" />
            }
          >
            <Sidebar />
          </Suspense>
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
