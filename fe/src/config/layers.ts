import type { LayerProps } from 'react-map-gl/mapbox'

export const planeLayer: LayerProps = {
  id: 'planes-layer',
  type: 'symbol',
  layout: {
    'icon-image': 'plane-icon',
    'icon-size': ['case', ['get', 'selected'], 1.2, 0.7],
    'icon-rotate': ['get', 'heading'],
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  paint: {
    'icon-color': ['get', 'color'],
    'icon-opacity': 1,
  },
}

export const airportCircleLayer: LayerProps = {
  id: 'airports-circle',
  type: 'circle',
  paint: {
    'circle-radius': 5,
    'circle-color': '#ffffff',
    'circle-stroke-color': '#aaaaaa',
    'circle-stroke-width': 1.5,
  },
}

export const airportLabelLayer: LayerProps = {
  id: 'airports-label',
  type: 'symbol',
  layout: {
    'text-field': ['get', 'code'],
    'text-size': 11,
    'text-anchor': 'top',
    'text-offset': [0, 0.8],
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#000000',
    'text-halo-width': 1,
  },
}

export const routeLineLayer: LayerProps = {
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': '#ffffff',
    'line-width': 1.5,
    'line-dasharray': [3, 3],
    'line-opacity': 0.6,
  },
}
