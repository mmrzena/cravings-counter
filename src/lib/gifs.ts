export type Gif = { id: string; url: string; title: string }
export type PreparedGif = Gif & { image: HTMLImageElement }

export function createGifPicker() {
  let totalPages = 1
  let queue: Gif[] = []
  let prepared: Promise<PreparedGif> | undefined
  let controller = new AbortController()

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
      if (queue.length) {
        const index = Math.floor(Math.random() * queue.length)
        return queue.splice(index, 1)[0]
      }
    }
    throw new Error('GIFs are unavailable right now.')
  }

  async function prepareGif(signal: AbortSignal): Promise<PreparedGif> {
    for (let attempt = 0; attempt < 3; attempt++) {
      signal.throwIfAborted()
      try {
        const gif = await chooseGif(signal)
        signal.throwIfAborted()
        const image = new Image(280, 200)
        image.loading = 'eager'
        image.fetchPriority = 'high'
        const imageSignal = AbortSignal.any([signal, AbortSignal.timeout(4000)])
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            image.onload = null
            image.onerror = null
            imageSignal.removeEventListener('abort', onAbort)
          }
          const onAbort = () => {
            cleanup()
            image.src = ''
            reject(imageSignal.reason)
          }
          image.onload = () => {
            cleanup()
            resolve()
          }
          image.onerror = () => {
            cleanup()
            reject(new Error('GIFs are unavailable right now.'))
          }
          imageSignal.addEventListener('abort', onAbort, { once: true })
          image.src = gif.url
        })
        // Keep the loaded element alive and display this exact image, avoiding
        // another media request when a host does not support browser caching.
        image.alt = gif.title
        image.className = 'random-gif-image loaded'
        return { ...gif, image }
      } catch (error) {
        signal.throwIfAborted()
        if (attempt === 2) throw error
      }
    }
    throw new Error('GIFs are unavailable right now.')
  }

  function prefetch() {
    if (prepared) return
    if (controller.signal.aborted) controller = new AbortController()
    const pending = prepareGif(AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]))
    prepared = pending
    // Background failures must not affect saving cravings or prevent a later retry.
    void pending.catch(() => {
      if (prepared === pending) prepared = undefined
    })
  }

  async function nextGif(signal: AbortSignal): Promise<PreparedGif> {
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

  function dispose() {
    controller.abort()
    prepared = undefined
    queue = []
  }

  return Object.assign(nextGif, { prefetch, dispose })
}
