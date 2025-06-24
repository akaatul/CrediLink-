import '@/styles/globals.css';
import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';

export const metadata: Metadata = {
  title: 'CrediLink+ | Web3-Powered E-Learning Platform',
  description: 'Transform your career with blockchain-verified credentials on CrediLink+, where learning meets Web3 innovation.',
  keywords: 'blockchain, e-learning, web3, credentials, certification, education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
} 