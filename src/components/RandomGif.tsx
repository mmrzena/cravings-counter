'use client'

import { useEffect, useRef, useState } from 'react'
import { createGifPicker } from '@/lib/gifs'

export default function RandomGif({
  pick,
  onDone,
}: {
  pick: ReturnType<typeof createGifPicker>
  onDone: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Loading your GIF…')

  useEffect(() => {
    const controller = new AbortController()
    const host = container.current!
    let doneTimer: ReturnType<typeof setTimeout> | undefined
    const fail = () => {
      setStatus('The GIF could not load. Your craving is saved.')
      doneTimer = setTimeout(onDone, 5000)
    }
    const timeout = setTimeout(() => {
      controller.abort()
      fail()
    }, 12000)
    pick(controller.signal)
      .then(({ image }) => {
        if (controller.signal.aborted) return
        host.replaceChildren(image)
        setStatus('')
        doneTimer = setTimeout(onDone, 10000)
      })
      .catch(() => {
        if (!controller.signal.aborted) fail()
      })
      .finally(() => clearTimeout(timeout))
    return () => {
      controller.abort()
      clearTimeout(timeout)
      clearTimeout(doneTimer)
      host.replaceChildren()
    }
  }, [pick, onDone])

  return (
    <div className="random-gif">
      {status && <p role="status">{status}</p>}
      <div ref={container} />
      <a href="https://gifsnap.com" target="_blank" rel="noreferrer">
        GIFs via GifSnap
      </a>
    </div>
  )
}
