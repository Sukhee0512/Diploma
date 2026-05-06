// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';


const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'GymHub - Нэг гишүүнчлэл, олон боломж',
  description: 'Нэг гишүүнчлэлийн эрхээр олон фитнес клубуудаар үйлчлүүлэх боломж',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen pt-16 md:pt-20">
            {children}
          </main>
          
        </AuthProvider>
      </body>
    </html>
  );
}