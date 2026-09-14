'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import Celebration from './Celebration'
import RandomGif from './RandomGif'
import { createGifPicker } from '@/lib/gifs'
import {
  type Craving,
  dayKey,
  groupByDay,
  removeCraving,
  saveCraving,
  useCravings,
} from '@/lib/cravings'

const beadColors = ['green', 'pink', 'gold', 'blue', 'lilac']

function dayLabel(at: string, now: Date) {
  const date = new Date(at)
  if (dayKey(date) === dayKey(now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

export default function Counter() {
  const { entries, error: storageError, ready } = useCravings()
  const [now, setNow] = useState<Date | null>(null)
  const [celebration, setCelebration] = useState(0)
  const [showAppreciation, setShowAppreciation] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [pickGif] = useState(createGifPicker)
  const lastTap = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const finishGif = useCallback(() => {
    setShowGif(false)
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const initial = setTimeout(refresh, 0)
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('Offline setup failed', error))
    }
    return () => {
      clearTimeout(initial)
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (!showAppreciation) return
    const timer = setTimeout(() => setShowAppreciation(false), 6500)
    return () => clearTimeout(timer)
  }, [celebration, showAppreciation])

  const today = now ? entries.filter((entry) => dayKey(new Date(entry.at)) === dayKey(now)) : []
  const groups = groupByDay(entries)
  const visibleGroups = showAll ? groups : groups.slice(0, 7)

  function resist() {
    if (showGif || Date.now() - lastTap.current < 700) return
    const entry = { id: crypto.randomUUID(), at: new Date().toISOString() }
    try {
      saveCraving(entry)
      lastTap.current = Date.now()
      setNow(new Date())
      setError(null)
      setShowAppreciation(true)
      setShowGif(true)
      setCelebration((count) => count + 1)
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigator.vibrate?.(35)
        buttonRef.current?.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(.94)' },
            { transform: 'scale(1.045)' },
            { transform: 'scale(1)' },
          ],
          { duration: 550, easing: 'ease' },
        )
      }
    } catch (error) {
      setError((error as Error).message)
    }
  }

  function remove(entry: Craving) {
    try {
      removeCraving(entry.id)
      setShowAppreciation(false)
      setError(null)
    } catch (error) {
      setError((error as Error).message)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="One more home">
          <span className="brand-mark">
            <Plus size={19} strokeWidth={2.5} />
          </span>
          one more<span className="wordmark-dot">.</span>
        </Link>
      </header>

      <main>
        <section className="counter-section" aria-labelledby="main-heading">
          <div className="date-line">
            <span className="date-dot" />
            {now
              ? now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
              : ''}
          </div>
          <h1 id="main-heading">Cravings counter</h1>

          <div className="button-stage">
            <div className="button-orbit" hidden={showGif}>
              <button
                ref={buttonRef}
                className="resist-button"
                aria-label="I resisted"
                onClick={resist}
                disabled={!ready || !!storageError}
              >
                <Plus size={64} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            {showGif && <RandomGif key={celebration} pick={pickGif} onDone={finishGif} />}
            <Celebration count={celebration} />
          </div>

          <div className="appreciation" aria-live="polite" aria-atomic="true">
            {showAppreciation && (
              <span key={celebration} className="appreciation-message">
                You got through this one.
              </span>
            )}
          </div>

          <div className="today-summary">
            <div>
              <strong data-testid="today-count">{ready && now ? today.length : '–'}</strong>
              <span>
                {today.length === 1 ? 'craving resisted today' : 'cravings resisted today'}
              </span>
            </div>
            <div className="bead-collection" aria-hidden="true">
              {today.length ? (
                today
                  .slice(0, 25)
                  .map((entry, index) => (
                    <span
                      key={entry.id}
                      className={`bead ${beadColors[(today.length - index - 1) % beadColors.length]}`}
                    />
                  ))
              ) : (
                <span className="empty-collection">
                  <span />
                  <span />
                  <span />
                </span>
              )}
              {today.length > 25 && <span className="bead-overflow">+{today.length - 25}</span>}
            </div>
          </div>

          {(error || storageError) && (
            <p role="alert" className="error-message">
              {error || storageError}
            </p>
          )}
        </section>

        <section id="history" className="history-section" aria-labelledby="history-heading">
          <div className="section-heading">
            <div>
              <h2 id="history-heading">History</h2>
            </div>
            <span className="total-label">
              <strong data-testid="total-count">{entries.length}</strong> in total
            </span>
          </div>
          {!ready ? (
            <p className="empty-history">Loading your history...</p>
          ) : groups.length === 0 ? (
            <p className="empty-history">No cravings recorded yet.</p>
          ) : (
            <div className="history-list">
              {visibleGroups.map((group) => (
                <details className="history-day" key={dayKey(new Date(group[0].at))}>
                  <summary>
                    <span className="day-icon">
                      <Check size={17} />
                    </span>
                    <span className="day-title">
                      {now ? dayLabel(group[0].at, now) : ''}
                      <span>
                        {new Date(group[0].at).toLocaleDateString('en', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    <span className="day-count">
                      {group.length} <span>resisted</span>
                    </span>
                    <ChevronDown className="day-chevron" size={17} />
                  </summary>
                  <ul>
                    {group.map((entry) => (
                      <li key={entry.id}>
                        <span className="entry-dot" />
                        <span>Craving resisted</span>
                        <time dateTime={entry.at}>
                          {new Date(entry.at).toLocaleTimeString('en', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </time>
                        <button
                          className="icon-button"
                          aria-label={`Delete craving at ${new Date(entry.at).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}`}
                          title="Delete entry"
                          onClick={() => remove(entry)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              {groups.length > 7 && (
                <button className="more-history" onClick={() => setShowAll((value) => !value)}>
                  {showAll ? 'Show less' : 'Show all history'}
                  <ArrowDown size={15} className={showAll ? 'flipped' : ''} />
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
