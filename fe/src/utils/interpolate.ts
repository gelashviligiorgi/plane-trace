export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function deadReckon(
  lat: number,
  lng: number,
  headingDeg: number,
  speedMs: number,
  elapsedSec: number
): { lat: number; lng: number } {
  const R = 6_371_000
  const dist = speedMs * elapsedSec
  const headingRad = (headingDeg * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const newLat = lat + ((dist * Math.cos(headingRad)) / R) * (180 / Math.PI)
  const newLng = lng + ((dist * Math.sin(headingRad)) / R) * (180 / Math.PI) / Math.cos(latRad)
  return { lat: newLat, lng: newLng }
}
