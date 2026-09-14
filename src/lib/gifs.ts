export type Gif = { id: string; url: string; title: string }

export function createGifPicker() {
  let totalPages = 1
  let queue: Gif[] = []
  let prepared: Promise<Gif> | undefined

  async function chooseGif(signal: AbortSignal): Promise<Gif> {
    for (let attempt = 0; attempt < 4; attempt++) {
      signal.throwIfAborted()
      if (!queue.length) {
        const page = 1 + Math.floor(Math.random() * totalPages)
        const response = await fetch(`/api/gifs?page=${page}`, { signal })
        if (!response.ok) throw new Error('GIFs are unavailable right now.')
        const result: { gifs: Gif[]; totalPages: number } = await response.json()
        signal.throwIfAborted()
        totalPages = result.totalPages
        queue = result.gifs
      }
      while (queue.length) {
        const index = Math.floor(Math.random() * queue.length)
        const [gif] = queue.splice(index, 1)
        return gif
      }
    }
    throw new Error('GIFs are unavailable right now.')
  }

  async function prepareGif(): Promise<Gif> {
    const signal = AbortSignal.timeout(12000)
    const gif = await chooseGif(signal)
    signal.throwIfAborted()
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      const cleanup = () => {
        image.onload = null
        image.onerror = null
        signal.removeEventListener('abort', onAbort)
      }
      const onAbort = () => {
        cleanup()
        image.src = ''
        reject(signal.reason)
      }
      image.onload = () => {
        cleanup()
        resolve()
      }
      image.onerror = () => {
        cleanup()
        reject(new Error('GIFs are unavailable right now.'))
      }
      signal.addEventListener('abort', onAbort, { once: true })
      image.src = gif.url
    })
    return gif
  }

  function prefetch() {
    if (prepared) return
    const pending = prepareGif()
    prepared = pending
    // Background failures must not affect saving cravings or prevent a later retry.
    void pending.catch(() => {
      if (prepared === pending) prepared = undefined
    })
  }

  async function nextGif(signal: AbortSignal): Promise<Gif> {
    signal.throwIfAborted()
    prefetch()
    const pending = prepared!
    const gif = await pending
    signal.throwIfAborted()
    if (prepared === pending) {
      prepared = undefined
      prefetch()
    }
    return gif
  }

  return Object.assign(nextGif, { prefetch })
}
