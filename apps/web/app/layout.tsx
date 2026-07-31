import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CliniBrain AI',
  description: 'AI-powered patient booking and assistant for clinics worldwide',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
                                                  }
