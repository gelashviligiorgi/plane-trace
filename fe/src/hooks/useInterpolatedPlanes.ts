import { useEffect, useRef, useState } from 'react'
import type { PlaneBasic, PlaneDetailed } from '../types'
import { lerp, deadReckon } from '../utils/interpolate'

const TICK_MS = 100
const UPDATE_INTERVAL_MS = 1000

export function useInterpolatedPlanes(
  planes: PlaneBasic[],
  details: PlaneDetailed | null
): PlaneBasic[] {
  const prevPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map())
  const wsPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map())
  const lastUpdateTime = useRef<number>(Date.now())

  const [interpolated, setInterpolated] = useState<PlaneBasic[]>(planes)

  useEffect(() => {
    prevPositions.current = new Map(wsPositions.current)

    const next = new Map<string, { lat: number; lng: number }>()
    for (const p of planes) next.set(p.id, { lat: p.latitude, lng: p.longitude })
    wsPositions.current = next
    lastUpdateTime.current = Date.now()
  }, [planes])

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - lastUpdateTime.current) / UPDATE_INTERVAL_MS
      const t = Math.min(elapsed, 1)

      setInterpolated(
        planes.map((plane) => {
          const prev = prevPositions.current.get(plane.id)
          const curr = wsPositions.current.get(plane.id)

          if (!prev || !curr) return plane

          if (details && plane.id === details.id) {
            const elapsedSec = (Date.now() - lastUpdateTime.current) / 1000
            const pos = deadReckon(curr.lat, curr.lng, details.heading, details.speed, elapsedSec)
            return { ...plane, latitude: pos.lat, longitude: pos.lng }
          }

          return {
            ...plane,
            latitude: lerp(prev.lat, curr.lat, t),
            longitude: lerp(prev.lng, curr.lng, t),
          }
        })
      )
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [planes, details])

  return interpolated
}
