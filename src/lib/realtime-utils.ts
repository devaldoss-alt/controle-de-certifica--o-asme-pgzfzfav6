import pb from '@/lib/pocketbase/client'

let isReconnecting = false
let watchdogStarted = false
const listeners = new Set<() => void>()

export function registerReconnectListener(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export async function forceRealtimeReconnect(): Promise<void> {
  if (isReconnecting) return
  isReconnecting = true

  try {
    await pb.realtime.unsubscribe()
  } catch {
    // ignore
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 1500))

  isReconnecting = false

  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore
    }
  })
}

export function startRealtimeWatchdog(): void {
  if (watchdogStarted) return
  watchdogStarted = true

  setInterval(() => {
    if (isReconnecting) return
    try {
      const realtime = (pb as any).realtime
      if (realtime) {
        const es = realtime.eventSource
        if (!es || es.readyState === EventSource.CLOSED) {
          forceRealtimeReconnect()
        }
      }
    } catch {
      // ignore
    }
  }, 30000)
}
