import { NextRequest, NextResponse } from 'next/server'
import type { Gif } from '@/lib/gifs'

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://gifsnap.com/api/v1/gifs/trending?page=${page}&limit=25`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!response.ok) throw new Error('GIF provider unavailable')
    const result = await response.json()
    if (!Array.isArray(result.data)) throw new Error('Invalid GIF response')
    const gifs: Gif[] = result.data.flatMap((item: Record<string, unknown>) => {
      if (typeof item.id !== 'string' || typeof item.url !== 'string') return []
      const title = typeof item.title === 'string' ? item.title : 'Random GIF'
      let url: URL
      try {
        url = new URL(item.url)
      } catch {
        return []
      }
      if (url.protocol !== 'https:') return []
      // The catalog also contains videos; only return browser image formats.
      if (/\.(mp4|webm)(?:$|\?)/i.test(item.url)) return []
      return [
        {
          id: item.id,
          url: item.url,
          title,
        },
      ]
    })
    const total = Number(result.pagination?.total)
    const totalPages =
      Number.isFinite(total) && total > 0 ? Math.min(100000, Math.ceil(total / 25)) : 1
    return NextResponse.json({ gifs, totalPages }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'GIFs are unavailable right now.' }, { status: 502 })
  }
}
