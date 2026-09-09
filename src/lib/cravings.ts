'use client'

import { useSyncExternalStore } from 'react'

export type Craving = { id: string; at: string }
type Snapshot = { entries: Craving[]; error: string | null; ready: boolean }
export const STORAGE_KEY = 'one-more:cravings:v1'
const initial: Snapshot = { entries: [], error: null, ready: false }
let snapshot = initial
let lastRaw: string | null | undefined
const listeners = new Set<() => void>()

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === lastRaw && snapshot.ready) return snapshot
    const value: unknown = raw ? JSON.parse(raw) : []
    if (
      !Array.isArray(value) ||
      !value.every(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.at === 'string' &&
          Number.isFinite(Date.parse(entry.at)),
      ) ||
      new Set(value.map((entry) => entry.id)).size !== value.length
    ) {
      throw new Error('Invalid history')
    }
    lastRaw = raw
    snapshot = {
      entries: value.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
      error: null,
      ready: true,
    }
  } catch {
    if (!snapshot.error)
      snapshot = {
        ...snapshot,
        ready: true,
        error:
          'Your saved history could not be read. Please check your browser storage settings. Your data has not been changed.',
      }
  }
  return snapshot
}

function notify() {
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      lastRaw = undefined
      notify()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCravings() {
  return useSyncExternalStore(subscribe, read, () => initial)
}

export function saveCraving(entry: Craving) {
  change((entries) =>
    entries.some((item) => item.id === entry.id) ? entries : [entry, ...entries],
  )
}

export function removeCraving(id: string) {
  change((entries) => entries.filter((entry) => entry.id !== id))
}

function change(update: (entries: Craving[]) => Craving[]) {
  const current = read()
  if (current.error) throw new Error(current.error)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(update(current.entries)))
  } catch {
    throw new Error('This craving could not be saved. Please check available storage and try again.')
  }
  lastRaw = undefined
  notify()
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function groupByDay(entries: Craving[]) {
  const groups = new Map<string, Craving[]>()
  for (const entry of entries) {
    const key = dayKey(new Date(entry.at))
    const group = groups.get(key) || []
    group.push(entry)
    groups.set(key, group)
  }
  return [...groups.values()]
}
