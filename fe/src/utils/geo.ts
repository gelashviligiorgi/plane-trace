import type { FeatureCollection } from 'geojson'
import type { PlaneBasic, PlaneDetailed } from '../types'

export function planesToGeoJSON(
  planes: PlaneBasic[],
  selectedId: string | null,
  details: PlaneDetailed | null
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: planes.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        id: p.id,
        altitude: p.altitude,
        color: p.color,
        selected: p.id === selectedId,
        heading: p.id === selectedId && details ? details.heading : p.heading,
      },
    })),
  }
}
