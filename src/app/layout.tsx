import type { CSSProperties, ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/Provider'

const fontVariables = {
  '--font-space-grotesk':
    '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
  '--font-dm-sans': '"Avenir", "Segoe UI", "Helvetica Neue", sans-serif',
  '--font-geist-mono':
    '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
} as CSSProperties

export const metadata: Metadata = {
  title: "Savly — Votre SAV, boosté par l'IA",
  description:
    "Plateforme SaaS qui centralise vos messages clients et propose des réponses intelligentes grâce à l'IA. Gagnez du temps et améliorez votre satisfaction client.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Savly',
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased" style={fontVariables}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
