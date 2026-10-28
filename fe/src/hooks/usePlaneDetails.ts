import { useEffect, useRef, useState } from 'react'
import type { PlaneDetailed } from '../types'

const WS_URL = 'ws://localhost:4000/ws/planes/details'
const MAX_RETRIES = 5

export function usePlaneDetails(selectedId: string | null): PlaneDetailed | null {
  const [details, setDetails] = useState<PlaneDetailed | null>(null)
  const retries = useRef(0)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(WS_URL)
      ws.current = socket

      socket.onopen = () => {
        if (selectedId) {
          socket.send(JSON.stringify({ type: 'subscribe', planeId: selectedId }))
        }
      }

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data as string)
        if (msg.type === 'plane-details') {
          setDetails(msg.data)
          retries.current = 0
        } else if (msg.type === 'error') {
          console.warn('WS details error:', msg.message)
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
  }, []) // single persistent connection

  useEffect(() => {
    if (!selectedId) {
      setDetails(null)
      return
    }
    const socket = ws.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', planeId: selectedId }))
    }
  }, [selectedId])

  return details
}
