export type Gif = { id: string; url: string; title: string }

export function createGifPicker() {
  let totalPages = 1
  let queue: Gif[] = []

  return async function nextGif(signal: AbortSignal): Promise<Gif> {
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
}
