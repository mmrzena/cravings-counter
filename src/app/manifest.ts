import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'One more - Cravings counter',
    short_name: 'One more',
    description: 'A simple cravings counter.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f8f5',
    theme_color: '#f7f8f5',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
