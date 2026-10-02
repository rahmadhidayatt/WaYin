import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AuthProvider } from '@/components/auth/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WAYIN – Peta Aksesibilitas Fasilitas Publik',
  description: 'Peta aksesibilitas berbasis komunitas untuk menemukan titik akses ramah disabilitas (ramp, lift, toilet, parkir) sebelum Anda tiba di lokasi.',
  keywords: ['aksesibilitas', 'peta disabilitas', 'ramp', 'lift', 'kursi roda', 'WAYIN', 'Jakarta'],
  authors: [{ name: 'WAYIN Community' }],
  icons: {
    icon: '/wayin-logo.png',
  },
  openGraph: {
    title: 'WAYIN – Find Your Way In',
    description: 'Peta aksesibilitas berbasis komunitas. Know before you go.',
    url: 'https://wayin.app',
    siteName: 'WAYIN',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}