export type PlaneBasic = {
  id: string
  latitude: number
  longitude: number
  altitude: number
  heading: number
  color: string
}

export type PlaneDetailed = PlaneBasic & {
  model: string
  airline: string
  flightNumber: string
  registration: string
  speed: number
  heading: number
  verticalSpeed: number
  origin: { airport: string; city: string }
  destination: { airport: string; city: string }
  departureTime: number
  flightDuration: number
  estimatedArrival: number
  numberOfPassengers: number
  maxPassengers: number
  status: 'departed' | 'enroute' | 'cruising' | 'landing'
}

export type BasicPlanesMessage = { type: 'planes'; data: PlaneBasic[] }
export type PlaneDetailsMessage = { type: 'plane-details'; data: PlaneDetailed }
export type ErrorMessage = { type: 'error'; message: string }
export type ServerMessage = BasicPlanesMessage | PlaneDetailsMessage | ErrorMessage
