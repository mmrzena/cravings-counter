import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'One more - Cravings counter',
  description: 'A simple cravings counter.',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'One more' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f8f5',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
