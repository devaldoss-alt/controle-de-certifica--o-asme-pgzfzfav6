import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

type Callback<T extends RecordModel> = (data: RecordSubscription<T>) => void

interface SubscriptionEntry {
  callbacks: Set<Function>
  unsubscribe: (() => Promise<void>) | null
  pending: boolean
}

const subscriptionRegistry = new Map<string, SubscriptionEntry>()

function getOrCreateSubscription(collectionName: string): SubscriptionEntry {
  let entry = subscriptionRegistry.get(collectionName)
  if (!entry) {
    entry = { callbacks: new Set(), unsubscribe: null, pending: false }
    subscriptionRegistry.set(collectionName, entry)
  }
  return entry
}

async function ensureSubscribed(collectionName: string) {
  const entry = getOrCreateSubscription(collectionName)
  if (entry.unsubscribe || entry.pending) return

  entry.pending = true
  try {
    const unsubscribeFn = await pb.collection(collectionName).subscribe('*', (e) => {
      const currentEntry = subscriptionRegistry.get(collectionName)
      if (!currentEntry) return
      currentEntry.callbacks.forEach((cb) => {
        try {
          cb(e)
        } catch {
          /* intentionally ignored */
        }
      })
    })
    const currentEntry = subscriptionRegistry.get(collectionName)
    if (!currentEntry) {
      unsubscribeFn().catch(() => {})
      return
    }
    if (currentEntry.callbacks.size === 0) {
      unsubscribeFn().catch(() => {})
      currentEntry.unsubscribe = null
    } else {
      currentEntry.unsubscribe = unsubscribeFn
    }
  } catch {
    /* intentionally ignored */
  } finally {
    entry.pending = false
  }
}

async function maybeUnsubscribe(collectionName: string) {
  const entry = subscriptionRegistry.get(collectionName)
  if (!entry) return
  if (entry.callbacks.size === 0 && entry.unsubscribe) {
    const fn = entry.unsubscribe
    entry.unsubscribe = null
    fn().catch(() => {})
  }
}

export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: Callback<TRecord>,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const entry = getOrCreateSubscription(collectionName)
    const wrappedCallback = (data: RecordSubscription<TRecord>) => {
      callbackRef.current(data)
    }
    entry.callbacks.add(wrappedCallback)

    let cancelled = false

    ensureSubscribed(collectionName).then(() => {
      if (cancelled) {
        entry.callbacks.delete(wrappedCallback)
        maybeUnsubscribe(collectionName)
      }
    })

    return () => {
      cancelled = true
      entry.callbacks.delete(wrappedCallback)
      maybeUnsubscribe(collectionName)
    }
  }, [collectionName, enabled])
}

export default useRealtime
