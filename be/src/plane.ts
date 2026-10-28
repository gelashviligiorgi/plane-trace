import { PlaneBasic, PlaneDetailed } from "./types";

// Real-world coordinates for each simulated airport. These anchor the
// simulation globally so planes appear over the correct continents instead
// of being confined to a random bounding box over North America.
const AIRPORTS: Record<string, { city: string; lat: number; lng: number }> = {
  JFK: { city: "New York",    lat:  40.6413, lng:  -73.7781 },
  LAX: { city: "Los Angeles", lat:  33.9425, lng: -118.4081 },
  ORD: { city: "Chicago",     lat:  41.9742, lng:  -87.9073 },
  LHR: { city: "London",      lat:  51.4775, lng:   -0.4614 },
  CDG: { city: "Paris",       lat:  49.0097, lng:    2.5478 },
  FRA: { city: "Frankfurt",   lat:  50.0379, lng:    8.5622 },
  AMS: { city: "Amsterdam",   lat:  52.3105, lng:    4.7683 },
  DXB: { city: "Dubai",       lat:  25.2532, lng:   55.3657 },
  IST: { city: "Istanbul",    lat:  41.2753, lng:   28.7519 },
  MIA: { city: "Miami",       lat:  25.7959, lng:  -80.2870 },
};

const AIRPORT_CODES = Object.keys(AIRPORTS);

// Returns the initial compass bearing (0–360°) from point 1 to point 2
// using the forward-azimuth formula on a spherical Earth.
function bearingTo(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;
  return bearing;
}

// Haversine distance in metres between two lat/lng points.
// Used to detect when a plane has reached its destination.
function distanceTo(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class Plane {
  private id: string;
  private latitude: number;
  private longitude: number;
  private altitude: number;
  private color: string;
  private speed: number;
  private model: string;
  private airline: string;
  private flightNumber: string;
  private registration: string;
  private heading: number;
  private verticalSpeed: number;
  private originCode: string;
  private destinationCode: string;
  private numberOfPassengers: number;
  private maxPassengers: number;
  private status: "departed" | "enroute" | "cruising" | "landing";
  private departureTime: number;
  private flightDuration: number;
  private estimatedArrival: number;
  private startTime: number;
  private altDelta: number;

  constructor(id: string) {
    this.id = id;
    this.startTime = Date.now();

    // Pick random origin + destination from the global airport list.
    // Previously the simulation used a fixed North-America bounding box
    // (lat 35–65, lng −120 to −60) with no connection to these airports,
    // which caused European/Middle-Eastern flights to appear over Canada.
    const originIdx = Math.floor(Math.random() * AIRPORT_CODES.length);
    let destIdx = Math.floor(Math.random() * AIRPORT_CODES.length);
    while (destIdx === originIdx) {
      destIdx = Math.floor(Math.random() * AIRPORT_CODES.length);
    }
    this.originCode = AIRPORT_CODES[originIdx]!;
    this.destinationCode = AIRPORT_CODES[destIdx]!;

    const origin = AIRPORTS[this.originCode]!;
    const dest = AIRPORTS[this.destinationCode]!;

    // Spawn at a random progress point (0–100 %) along the straight-line
    // route between origin and destination so the map starts populated
    // instead of having all planes depart at once.
    const progress = Math.random();
    this.latitude = origin.lat + (dest.lat - origin.lat) * progress;
    this.longitude = origin.lng + (dest.lng - origin.lng) * progress;

    // Initial heading points straight at the destination.
    this.heading = bearingTo(this.latitude, this.longitude, dest.lat, dest.lng);

    // Altitude
    const altitudeFeet = 20000 + Math.random() * 30000;
    this.altitude = altitudeFeet * 0.3048;
    this.altDelta = (Math.random() - 0.5) * 30.48;

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80"];
    this.color = colors[Math.floor(Math.random() * colors.length)]!;

    const speedKnots = 400 + Math.random() * 300;
    this.speed = speedKnots * 0.514444;

    const models = ["Boeing 737", "Airbus A320", "Boeing 787", "Airbus A350", "Boeing 777", "Airbus A380", "Embraer E190", "Bombardier CRJ"];
    this.model = models[Math.floor(Math.random() * models.length)]!;

    const airlines = ["American Airlines", "United Airlines", "Delta Air Lines", "Lufthansa", "British Airways", "Air France", "KLM", "Emirates", "Qatar Airways", "Turkish Airlines"];
    this.airline = airlines[Math.floor(Math.random() * airlines.length)]!;

    const airlineCode = this.airline.substring(0, 2).toUpperCase().replace(/\s/g, "");
    this.flightNumber = `${airlineCode}${1000 + Math.floor(Math.random() * 9000)}`;

    this.registration = `N${Math.floor(10000 + Math.random() * 90000)}`;

    this.verticalSpeed = (Math.random() - 0.5) * 20;

    this.maxPassengers = 150 + Math.floor(Math.random() * 350);
    this.numberOfPassengers = Math.floor(this.maxPassengers * (0.6 + Math.random() * 0.4));

    const statuses: Array<"departed" | "enroute" | "cruising" | "landing"> = ["departed", "enroute", "cruising", "landing"];
    this.status = statuses[Math.floor(Math.random() * statuses.length)]!;

    this.flightDuration = 0;

    const flightTimeHours = 2 + Math.random() * 6;
    this.estimatedArrival = Date.now() + flightTimeHours * 3600000;

    // Back-calculate departure time from how far the plane has already flown,
    // so elapsed time is consistent with the spawn position along the route.
    const flownMetres = distanceTo(origin.lat, origin.lng, this.latitude, this.longitude);
    this.departureTime = Date.now() - (flownMetres / this.speed) * 1000;
  }

  update(): void {
    const TICK_SEC = 0.1; // 100 ms tick
    const dest = AIRPORTS[this.destinationCode]!;

    // Recompute bearing each tick so the plane continuously corrects toward
    // the destination rather than flying a fixed straight-line heading.
    this.heading = bearingTo(this.latitude, this.longitude, dest.lat, dest.lng);

    // Dead-reckon the new position: advance speed × dt metres along heading.
    const distThisTick = this.speed * TICK_SEC;
    const R = 6_371_000;
    const headingRad = (this.heading * Math.PI) / 180;
    const latRad = (this.latitude * Math.PI) / 180;
    this.latitude  += ((distThisTick * Math.cos(headingRad)) / R) * (180 / Math.PI);
    this.longitude += ((distThisTick * Math.sin(headingRad)) / R) * (180 / Math.PI) / Math.cos(latRad);

    // Once within 50 km of the destination swap origin ↔ destination so the
    // plane turns around and flies the return leg without jumping position.
    if (distanceTo(this.latitude, this.longitude, dest.lat, dest.lng) < 50_000) {
      const tmp = this.originCode;
      this.originCode = this.destinationCode;
      this.destinationCode = tmp;
      this.departureTime = Date.now();
    }

    // Altitude drift
    this.altitude += this.altDelta;
    if (this.altitude < 6096 || this.altitude > 15240) {
      this.altDelta *= -1;
    }

    // Minor variations
    this.verticalSpeed = Math.max(-15, Math.min(15, this.verticalSpeed + (Math.random() - 0.5) * 2));
    this.speed = Math.max(154.3, Math.min(411.6, this.speed + (Math.random() - 0.5) * 5));

    this.flightDuration = Math.floor((Date.now() - this.startTime) / 60000);
  }

  getBasic(): PlaneBasic {
    return {
      id: this.id,
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      heading: this.heading,
      color: this.color,
    };
  }

  getDetailed(): PlaneDetailed {
    const origin = AIRPORTS[this.originCode]!;
    const dest = AIRPORTS[this.destinationCode]!;
    return {
      id: this.id,
      model: this.model,
      airline: this.airline,
      flightNumber: this.flightNumber,
      registration: this.registration,
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      speed: this.speed,
      heading: this.heading,
      verticalSpeed: this.verticalSpeed,
      origin:      { airport: this.originCode,      city: origin.city },
      destination: { airport: this.destinationCode, city: dest.city   },
      departureTime: this.departureTime,
      flightDuration: this.flightDuration,
      estimatedArrival: this.estimatedArrival,
      numberOfPassengers: this.numberOfPassengers,
      maxPassengers: this.maxPassengers,
      status: this.status,
      color: this.color,
    };
  }

  getId(): string {
    return this.id;
  }
}
