import { useRef, useCallback } from 'react'
import Map, { Source, Layer } from 'react-map-gl/mapbox'
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { PlaneBasic, PlaneDetailed } from '../types'
import { planesToGeoJSON } from '../utils/geo'
import { airportsGeoJSON, routeGeoJSON } from '../utils/airports'
import { svgToImage } from '../utils/svg'
import planeSvg from '../assets/plane.svg?raw'
import { planeLayer, airportCircleLayer, airportLabelLayer, routeLineLayer } from '../config/layers'

interface FlightMapProps {
  planes: PlaneBasic[]
  selectedId: string | null
  details: PlaneDetailed | null
  onPlaneSelect: (id: string | null) => void
}

export function FlightMap({ planes, selectedId, details, onPlaneSelect }: FlightMapProps) {
  const mapRef = useRef<MapRef>(null)
  const iconLoaded = useRef(false)

  const geojson = planesToGeoJSON(planes, selectedId, details)

  const selectedPlane = selectedId ? planes.find((p) => p.id === selectedId) : null
  const route =
    selectedPlane && details
      ? routeGeoJSON(selectedPlane.longitude, selectedPlane.latitude, details.origin.airport, details.destination.airport)
      : null

  const onMapLoad = useCallback(async () => {
    const map = mapRef.current?.getMap()
    if (!map || iconLoaded.current) return
    const img = await svgToImage(planeSvg)
    if (!map.hasImage('plane-icon')) {
      map.addImage('plane-icon', img, { sdf: true })
    }
    iconLoaded.current = true
  }, [])

  const onClick = useCallback(
    (event: MapMouseEvent) => {
      const features = event.features
      if (features && features.length > 0) {
        const id = features[0].properties?.id as string
        onPlaneSelect(id === selectedId ? null : id)
      } else {
        onPlaneSelect(null)
      }
    },
    [selectedId, onPlaneSelect]
  )

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{ longitude: 20, latitude: 48, zoom: 3 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      onLoad={onMapLoad}
      onClick={onClick}
      interactiveLayerIds={['planes-layer']}
    >
      <Source id="airports" type="geojson" data={airportsGeoJSON}>
        <Layer {...airportCircleLayer} />
        <Layer {...airportLabelLayer} />
      </Source>

      {route && (
        <Source id="route" type="geojson" data={route}>
          <Layer {...routeLineLayer} />
        </Source>
      )}

      <Source id="planes" type="geojson" data={geojson}>
        <Layer {...planeLayer} />
      </Source>
    </Map>
  )
}
