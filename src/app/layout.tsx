import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'SecureExam Pro',
  description: 'An advanced online examination platform with AI-powered proctoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
