import type { FeatureCollection } from 'geojson'

export type Airport = {
  code: string
  city: string
  longitude: number
  latitude: number
}

export const AIRPORTS: Airport[] = [
  { code: 'JFK', city: 'New York',     longitude: -73.7781,  latitude:  40.6413 },
  { code: 'LAX', city: 'Los Angeles',  longitude: -118.4081, latitude:  33.9425 },
  { code: 'ORD', city: 'Chicago',      longitude: -87.9073,  latitude:  41.9742 },
  { code: 'LHR', city: 'London',       longitude:  -0.4614,  latitude:  51.4775 },
  { code: 'CDG', city: 'Paris',        longitude:   2.5478,  latitude:  49.0097 },
  { code: 'FRA', city: 'Frankfurt',    longitude:   8.5622,  latitude:  50.0379 },
  { code: 'AMS', city: 'Amsterdam',    longitude:   4.7683,  latitude:  52.3105 },
  { code: 'DXB', city: 'Dubai',        longitude:  55.3657,  latitude:  25.2532 },
  { code: 'IST', city: 'Istanbul',     longitude:  28.7519,  latitude:  41.2753 },
  { code: 'MIA', city: 'Miami',        longitude: -80.2870,  latitude:  25.7959 },
]

export const airportsGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: AIRPORTS.map((a) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
    properties: { code: a.code, city: a.city },
  })),
}


function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000 // Earth's mean radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function flightTimes(
  planeLat: number,
  planeLng: number,
  originCode: string,
  destinationCode: string,
  speedMs: number
): { elapsedMinutes: number; remainingMinutes: number } {
  const origin = AIRPORTS.find((a) => a.code === originCode)
  const dest = AIRPORTS.find((a) => a.code === destinationCode)
  if (!origin || !dest || speedMs <= 0) return { elapsedMinutes: 0, remainingMinutes: 0 }
  const flown = haversine(origin.latitude, origin.longitude, planeLat, planeLng)
  const remaining = haversine(planeLat, planeLng, dest.latitude, dest.longitude)
  return {
    elapsedMinutes: flown / speedMs / 60,
    remainingMinutes: remaining / speedMs / 60,
  }
}

export function routeProgress(
  planeLat: number,
  planeLng: number,
  originCode: string,
  destinationCode: string
): number {
  const origin = AIRPORTS.find((a) => a.code === originCode)
  const dest = AIRPORTS.find((a) => a.code === destinationCode)
  if (!origin || !dest) return 0
  const total = haversine(origin.latitude, origin.longitude, dest.latitude, dest.longitude)
  const flown = haversine(origin.latitude, origin.longitude, planeLat, planeLng)
  return Math.min(flown / total, 1)
}

export function routeGeoJSON(
  planeLng: number,
  planeLat: number,
  originCode: string,
  destinationCode: string,
): FeatureCollection | null {
  const origin = AIRPORTS.find((a) => a.code === originCode)
  const dest = AIRPORTS.find((a) => a.code === destinationCode)
  if (!origin || !dest) return null
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.longitude, origin.latitude],
            [planeLng, planeLat],
            [dest.longitude, dest.latitude],
          ],
        },
        properties: {},
      },
    ],
  }
}
