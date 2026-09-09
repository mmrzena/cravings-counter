import { readFile } from 'node:fs/promises'

const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
const packages = new Map()
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path) continue
  const name = entry.name || path.split('node_modules/').at(-1)
  if (!entry.resolved?.startsWith('https://registry.npmjs.org/')) {
    throw new Error(`Unverified package origin: ${name}`)
  }
  const versions = packages.get(name) || new Set()
  versions.add(entry.version)
  packages.set(name, versions)
}
const queue = [...packages]
let checked = 0
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const [name, versions] = queue.shift()
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) throw new Error(`Cannot verify ${name}: ${response.status}`)
      const metadata = await response.json()
      for (const version of versions) {
        const published = Date.parse(metadata.time?.[version])
        if (!Number.isFinite(published) || published >= cutoff) {
          throw new Error(`${name}@${version} is not verified as older than seven days`)
        }
        checked++
      }
    }
  }),
)
console.log(`Verified ${checked} locked package versions: all older than seven days.`)
