import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://kairoscli.vercel.app'),
  title: {
    default: 'Kairos — E2EE Secrets Manager',
    template: '%s | Kairos',
  },
  description: 'End-to-end encrypted secrets manager. Secrets are encrypted on your device — the server never sees plaintext. Pull env vars into any environment with one CLI command.',
  keywords: ['secrets manager', 'e2ee', 'end-to-end encryption', 'devops', 'cli', 'environment variables', 'dotenv', 'vault'],
  authors: [{ name: 'Kairos' }],
  creator: 'Kairos',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kairoscli.vercel.app',
    siteName: 'Kairos',
    title: 'Kairos — E2EE Secrets Manager',
    description: 'Secrets are encrypted on your device — the server never sees plaintext. Pull env vars into any environment with one CLI command.',
    images: [{ url: '/kairos-logo.svg', width: 512, height: 512, alt: 'Kairos' }],
  },
  twitter: {
    card: 'summary',
    title: 'Kairos — E2EE Secrets Manager',
    description: 'Secrets are encrypted on your device — the server never sees plaintext. Pull env vars into any environment with one CLI command.',
    images: ['/kairos-logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('kairos-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}})()` }} />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
