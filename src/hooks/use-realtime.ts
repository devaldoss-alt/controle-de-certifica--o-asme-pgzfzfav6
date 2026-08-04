import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

let tokenRefreshSetup = false

function setupPeriodicTokenRefresh() {
  if (tokenRefreshSetup) return
  tokenRefreshSetup = true

  setInterval(
    async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          // silent — onChange listener handles re-auth elsewhere
        }
      }
    },
    30 * 60 * 1000,
  )
}

export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    setupPeriodicTokenRefresh()

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let subscribeId = 0
    let authChangeUnsubscribe: (() => void) | undefined

    const doSubscribe = async () => {
      if (cancelled) return
      const currentId = ++subscribeId

      if (unsubscribeFn) {
        try {
          await unsubscribeFn()
        } catch {
          /* intentionally ignored */
        }
        unsubscribeFn = undefined
      }

      if (cancelled || currentId !== subscribeId) return

      try {
        const fn = await pb.collection<TRecord>(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })
        if (cancelled || currentId !== subscribeId) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch {
        /* intentionally ignored */
      }
    }

    const ensureFreshTokenAndSubscribe = async () => {
      if (!pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          /* intentionally ignored */
        }
      }
      if (!cancelled) {
        await doSubscribe()
      }
    }

    ensureFreshTokenAndSubscribe()

    authChangeUnsubscribe = pb.authStore.onChange((token) => {
      if (cancelled || !token) return
      doSubscribe()
    })

    return () => {
      cancelled = true
      if (authChangeUnsubscribe) authChangeUnsubscribe()
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
