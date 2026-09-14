'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { type Gif, createGifPicker } from '@/lib/gifs'

export default function RandomGif({
  pick,
  onDone,
}: {
  pick: ReturnType<typeof createGifPicker>
  onDone: () => void
}) {
  const [gif, setGif] = useState<Gif | null>(null)
  const [status, setStatus] = useState('Loading your GIF…')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      setStatus('The GIF could not load. Your craving is saved.')
    }, 12000)
    pick(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setGif(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('The GIF could not load. Your craving is saved.')
      })
      .finally(() => clearTimeout(timeout))
    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [pick])

  useEffect(() => {
    if (!gif || loaded) return
    const timeout = setTimeout(() => {
      setGif(null)
      setStatus('The GIF could not load. Your craving is saved.')
    }, 12000)
    return () => clearTimeout(timeout)
  }, [gif, loaded])

  useEffect(() => {
    if (!loaded && status === 'Loading your GIF…') return
    const timeout = setTimeout(onDone, loaded ? 10000 : 5000)
    return () => clearTimeout(timeout)
  }, [loaded, status, onDone])

  return (
    <div className="random-gif">
      {!loaded && <p role="status">{status}</p>}
      {gif && (
        <Image
          className={loaded ? 'random-gif-image loaded' : 'random-gif-image'}
          src={gif.url}
          alt={gif.title}
          width={280}
          height={200}
          loading="eager"
          unoptimized
          onLoad={() => setLoaded(true)}
          onError={() => {
            setGif(null)
            setStatus('The GIF could not load. Your craving is saved.')
          }}
        />
      )}
      <a href="https://gifsnap.com" target="_blank" rel="noreferrer">
        GIFs via GifSnap
      </a>
    </div>
  )
}
