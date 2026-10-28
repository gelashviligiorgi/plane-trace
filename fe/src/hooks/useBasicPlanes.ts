import { useEffect, useRef, useState } from 'react'
import type { PlaneBasic } from '../types'

const WS_URL = 'ws://localhost:4000/ws/planes/basic'
const MAX_RETRIES = 5

export function useBasicPlanes(): PlaneBasic[] {
  const [planes, setPlanes] = useState<PlaneBasic[]>([])
  const retries = useRef(0)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(WS_URL)
      ws.current = socket

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data as string)
        if (msg.type === 'planes') {
          const sample = msg.data[0]
          console.log('[useBasicPlanes] sample plane:', {
            id: sample?.id,
            heading: sample?.heading,
            latitude: sample?.latitude,
            longitude: sample?.longitude,
          })
          setPlanes(msg.data)
          retries.current = 0
        }
      }

      socket.onclose = () => {
        if (retries.current < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** retries.current, 30_000)
          retries.current++
          setTimeout(connect, delay)
        }
      }
    }

    connect()
    return () => ws.current?.close()
  }, [])

  return planes
}
