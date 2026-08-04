import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'
import {
  forceRealtimeReconnect,
  registerReconnectListener,
  startRealtimeWatchdog,
} from '@/lib/realtime-utils'

export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    startRealtimeWatchdog()

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let isSubscribing = false
    let retryCount = 0
    const MAX_RETRIES = 5
    const BASE_DELAY = 1000
    const MAX_DELAY = 8000

    const doSubscribe = () => {
      if (cancelled || isSubscribing) return
      isSubscribing = true

      if (unsubscribeFn) {
        const oldFn = unsubscribeFn
        unsubscribeFn = undefined
        oldFn().catch(() => {})
      }

      pb.collection<TRecord>(collectionName)
        .subscribe('*', (e) => {
          callbackRef.current(e)
        })
        .then((fn) => {
          isSubscribing = false
          if (cancelled) {
            fn().catch(() => {})
            return
          }
          unsubscribeFn = fn
          retryCount = 0
        })
        .catch(() => {
          isSubscribing = false
          if (cancelled) return
          if (retryCount < MAX_RETRIES) {
            retryCount++
            const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY)
            retryTimer = setTimeout(() => {
              forceRealtimeReconnect().then(() => {
                if (!cancelled && !unsubscribeFn) doSubscribe()
              })
            }, delay)
          }
        })
    }

    doSubscribe()

    const unregister = registerReconnectListener(() => {
      if (cancelled) return
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
        unsubscribeFn = undefined
      }
      retryCount = 0
      doSubscribe()
    })

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      unregister()
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
