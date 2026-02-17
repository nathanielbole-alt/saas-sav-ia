import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAV IA — Votre SAV, boosté par l'IA",
  description:
    "Plateforme SaaS qui centralise vos messages clients et propose des réponses intelligentes grâce à l'IA. Gagnez du temps et améliorez votre satisfaction client.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SAV IA',
  },
};

export const viewport = {
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
