# Flight Radar - Interview Task

## Interview Task

This repository provides the backend for an interview exercise where a candidate builds a web frontend.

The expected frontend should include:

- The frontend should be built in the `fe` folder of this
- Using `React` with `TypeScript`
- Map view that plots planes in real time. Possible options could be e.g. `MapLibre`, `MapBox`, `Leaflet` or any other map engine provider of your choice.
- Planes can be selected/unselected to show/hide detailed information
- Consumes flight data exclusively from the provided WebSocket backend

## Backend

### Prerequisites

- Node.js 18+
- npm

### Install & Start

```bash
cd be
npm install
npm run dev
```

The server listens at `ws://localhost:4000` by default.

#### Configuration

Create `be/.env` by copying the `be/.env.example` file:

```env
PORT=4000
PLANES_COUNT=20
BASIC_UPDATE_INTERVAL_MS=1000
DETAILED_UPDATE_INTERVAL_MS=1000
```

#### Environment variable description

- `PORT`: WebSocket server port
- `PLANES_COUNT`: Number of simulated planes
- `BASIC_UPDATE_INTERVAL_MS`: Basic data broadcast interval (ms)
- `DETAILED_UPDATE_INTERVAL_MS`: Detailed data interval (ms)

#### Endpoint: `/ws/planes/basic` - Broadcasts all planes to all clients

The server sends this response on ever configured `BASIC_UPDATE_INTERVAL_MS`.

```json
{
  "type": "planes",
  "data": [
    {
      "id": "plane-1",
      "latitude": 45.1234,
      "longitude": -75.5678,
      "altitude": 10668,
      "color": "#FF6B6B"
    }
  ]
}
```

#### Endpoint: `/ws/planes/details` — detailed info for a single subscribed plane

In order to receive detailed plane information, the client must subscribe by sending the request:

```json
{ 
  "type": "subscribe", 
  "planeId": "plane-1"
}
```

When subscribed, the server will send the following response:

```json
{
  "type": "plane-details",
  "data": {
    "id": "plane-1",
    "model": "Boeing 737",
    "airline": "Airline Name",
    "flightNumber": "AA123",
    "registration": "N12345",
    "latitude": 45.1234,
    "longitude": -75.5678,
    "altitude": 10668,
    "speed": 283,
    "heading": 180,
    "verticalSpeed": 0,
    "origin": { "airport": "JFK", "city": "New York" },
    "destination": { "airport": "LAX", "city": "Los Angeles" },
    "flightDuration": 125,
    "estimatedArrival": 3600,
    "numberOfPassengers": 180,
    "maxPassengers": 200,
    "status": "cruising",
    "color": "#FF6B6B"
  }
}
```

The server sends this response on ever configured `DETAILED_UPDATE_INTERVAL_MS`

#### Errors

```json
{ 
  "type": "error", 
  "message": "Plane plane-1 not found"
}
```

```json
{ 
  "type": "error", 
  "message": "Invalid message format. Expected { type: 'subscribe', planeId: string }"
}
```

```json
{ 
  "type": "error",
  "message": "Invalid JSON message"
}
```

#### Notes

- Send a `subscribe` message after connecting.
- Send a new `subscribe` to switch planes.
- Invalid plane IDs close the connection (code 1008) after an error message.
- Initial plane data (basic) is sent immediately, then updates at the configured interval.

### Simulation — Global Flight Distribution

The original simulation spawned planes at random positions within a fixed North America bounding box (lat 35–65°N, lng 120–60°W), completely disconnected from the origin/destination airports. This caused flights like Frankfurt → New York to appear over Canada.

The simulation was updated in `be/src/plane.ts` to fix this:

- **Real airport coordinates** — each of the 10 airports has its actual lat/lng stored in the backend, so positions are geographically accurate across North America, Europe, and the Middle East.
- **Route-based spawn** — each plane is placed at a random progress point (0–100%) along the straight line between its origin and destination, so the map starts populated without all planes departing simultaneously.
- **Heading-corrected movement** — every 100 ms tick the bearing toward the destination is recalculated and the plane advances along that bearing using dead-reckoning. Previously planes drifted randomly and bounced off the bounding box walls.
- **Turn-around on arrival** — when a plane comes within 50 km of its destination the origin and destination are swapped, so it flies the return leg continuously without jumping position.

### Data Models

These are the data models returned by the backend:

```typescript
type PlaneBasic = {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  color: string;
};

type PlaneDetailed = {
  id: string;
  model: string;
  airline: string;
  flightNumber: string;
  registration: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  verticalSpeed: number;
  origin: { 
    airport: string; 
    city: string
  };
  destination: { 
    airport: string; 
    city: string
  };
  flightDuration: number;
  estimatedArrival: number;
  numberOfPassengers: number;
  maxPassengers: number;
  status: "departed" | "enroute" | "cruising" | "landing";
  color: string;
};
```

---

## Backend Changes

The following changes were made to the backend simulation in `be/src/plane.ts` to make flights appear in geographically correct locations instead of being confined to North America.

### Problem

The original simulation generated plane positions using a hardcoded North America bounding box:

```ts
this.latitude  = 35 + Math.random() * 30;   // 35–65°N
this.longitude = -120 + Math.random() * 60; // −120 to −60°W
```

The origin and destination airports (e.g. Frankfurt, Dubai) were purely decorative labels — they had no coordinates and no effect on where planes were placed or how they moved. A flight labelled Frankfurt → New York would appear over Canada.

### What was changed

#### 1. Added real airport coordinates

A module-level `AIRPORTS` record was added with the actual lat/lng of all 10 airports, spanning North America, Europe, and the Middle East. Previously airports were a local array inside the constructor with only name fields and no coordinates.

#### 2. Route-based spawn position

Each plane is now placed at a random point along the straight line between its origin and destination airports:

```ts
const progress = Math.random(); // 0–100% along the route
this.latitude  = origin.lat + (dest.lat - origin.lat) * progress;
this.longitude = origin.lng + (dest.lng - origin.lng) * progress;
```

This means the map starts populated with planes spread across real intercontinental routes rather than all clustered over North America.

#### 3. Heading-corrected movement using dead-reckoning

Two helper functions were added — `bearingTo()` and `distanceTo()`. Every 100 ms tick the plane's bearing toward its destination is recalculated and the position is advanced along that bearing:

```ts
this.heading = bearingTo(this.latitude, this.longitude, dest.lat, dest.lng);
// then advance latitude and longitude by speed × 0.1 s along that heading
```

Previously planes moved by adding a fixed random `latDelta`/`lngDelta` each tick with no relation to speed, heading, or destination.

#### 4. Turn-around on arrival

When a plane comes within 50 km of its destination, origin and destination are swapped:

```ts
if (distanceTo(this.latitude, this.longitude, dest.lat, dest.lng) < 50_000) {
  const tmp = this.originCode;
  this.originCode = this.destinationCode;
  this.destinationCode = tmp;
}
```

On the next tick `bearingTo()` recalculates the heading toward the new destination, so the plane naturally turns around and flies the return leg. Previously planes bounced off the edges of the North America bounding box.

#### 5. Departure time

A `departureTime` field (unix ms timestamp) was added to `PlaneDetailed`. At spawn it is back-calculated from the plane's current position along the route so it reflects when the flight "would have" departed the origin:

```ts
const flownMetres = distanceTo(origin.lat, origin.lng, this.latitude, this.longitude);
this.departureTime = Date.now() - (flownMetres / this.speed) * 1000;
```

When the plane turns around, `departureTime` is reset to `Date.now()` so the new leg starts from zero. The frontend uses this to show accurate elapsed flight time as `Date.now() - details.departureTime`, which increases monotonically and resets correctly on each new leg.
