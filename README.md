# One more

A one-tap cravings counter. Each tap saves a resisted craving, plays a brief
celebration, and adds it to history grouped by local calendar day.

Each saved tap temporarily replaces the button with a random celebration GIF from
GifSnap's search results. The button returns after the GIF has displayed for 10 seconds.
No API key or extra package is needed. The app shuffles batches, fetches additional pages,
and preloads one random GIF when the counter opens, including the image itself.
Each tap uses that GIF and preloads the next one. No seen-GIF history is stored;
repeats are possible.
If the catalog or image cannot load, the craving is still saved.

GIF metadata comes through `/api/gifs`; images load from the provider's media
hosts. This feature needs an internet connection. GifSnap is a best-effort public
service; its source code has not been verified as open source.
API documentation: https://www.gifsnap.com/docs

## Setup

Next.js App Router, React, TypeScript, Tailwind CSS, and ESLint, following the
structure of the neighboring roubenka-rajenka and kardiologie-brandys projects.
Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

## Dependency policy

Only package versions strictly older than seven days may be installed, including
transitive dependencies. `.npmrc` freezes resolution before September 1, 2026,
pins direct dependencies, and disables dependency lifecycle scripts. Keep the
lockfile committed. This age gate reduces exposure to fresh releases; it does
not guarantee a package is safe.

To update dependencies, first set `before` to a UTC timestamp more than seven
days in the past, then resolve and verify before installing:

```sh
npm install --package-lock-only --ignore-scripts
npm run deps:check
npm audit
npm ci
```

`deps:check` verifies every locked version against npm publication timestamps
and rejects missing timestamps, non-registry sources, and versions seven days
old or newer. It requires network access.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
```

## Storage and offline use

History is a JSON array of `{ id, at }` records in `localStorage` under
`one-more:cravings:v1`. Timestamps use UTC; history groups them in the device's
local timezone. There is no account, history backend, analytics, or external font request.
Clearing site data removes the history. Different origins and browser profiles
have separate history. Concurrent writes from separate tabs are not atomic.

The production service worker precaches the document, JavaScript, CSS, and icons
for offline reloads after the initial successful visit. Service workers and PWA
installation require HTTPS or localhost. Offline caching is disabled in development.
Bump the cache version in `public/sw.js` when releasing changed application assets;
the update activates after existing app windows close.

```sh
npm run build
npm run start
```
