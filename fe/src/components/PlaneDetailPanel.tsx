import type { PlaneDetailed } from '../types'
import { routeProgress, flightTimes } from '../utils/airports'

const STATUS_COLORS: Record<PlaneDetailed['status'], string> = {
  departed: 'bg-blue-500',
  enroute: 'bg-green-500',
  cruising: 'bg-emerald-500',
  landing: 'bg-orange-500',
}

function fmt(value: number, decimals = 0) {
  return value.toFixed(decimals)
}

function fmtDuration(mins: number) {
  const totalSecs = Math.floor(mins * 60)
  if (totalSecs < 60) return `${totalSecs}s`
  const h = Math.floor(mins / 60)
  const m = Math.floor(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface Props {
  details: PlaneDetailed | null
  error: string | null
  onClose: () => void
}

export function PlaneDetailPanel({ details, error, onClose }: Props) {
  const visible = details !== null || error !== null

  const elapsedMinutes = details ? (Date.now() - details.departureTime) / 60_000 : 0
  const pct = details ? routeProgress(details.latitude, details.longitude, details.origin.airport, details.destination.airport) : 0
  const { remainingMinutes } = details
    ? flightTimes(details.latitude, details.longitude, details.origin.airport, details.destination.airport, details.speed)
    : { remainingMinutes: 0 }

  return (
    <div
      className={`
        absolute top-0 right-0 h-full w-80 bg-gray-900 text-white shadow-2xl
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {error && (
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold">Flight Unavailable</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-orange-400 font-semibold text-sm">No information available for this flight.</p>
            <p className="text-gray-400 text-sm">Possible reasons:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>The flight has landed or been cancelled</li>
              <li>The aircraft is temporarily out of range</li>
              <li>The flight data feed was interrupted</li>
            </ul>
          </div>
        </div>
      )}

      {!error && details && (
        <div className="p-4 space-y-4">

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{details.flightNumber}</h2>
              <p className="text-gray-400 text-sm">{details.airline}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_COLORS[details.status]}`}>
                {details.status}
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">ROUTE</p>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold">{details.origin.airport}</p>
                <p className="text-xs text-gray-400">{details.origin.city}</p>
              </div>
              <div className="text-gray-500 text-lg">→</div>
              <div className="text-center">
                <p className="text-2xl font-bold">{details.destination.airport}</p>
                <p className="text-xs text-gray-400">{details.destination.city}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(pct * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
            <p className="text-xs text-gray-400 col-span-2">POSITION</p>
            <div>
              <p className="text-xs text-gray-500">Altitude</p>
              <p className="font-semibold">{fmt(details.altitude * 3.28084)} ft</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Heading</p>
              <p className="font-semibold">{fmt(details.heading)}°</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="font-semibold">{fmt(details.latitude, 4)}°</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="font-semibold">{fmt(details.longitude, 4)}°</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
            <p className="text-xs text-gray-400 col-span-2">PERFORMANCE</p>
            <div>
              <p className="text-xs text-gray-500">Speed</p>
              <p className="font-semibold">{fmt(details.speed * 1.94384)} kn</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vertical Speed</p>
              <p className="font-semibold">{fmt(details.verticalSpeed * 196.85)} fpm</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
            <p className="text-xs text-gray-400 col-span-2">AIRCRAFT</p>
            <div>
              <p className="text-xs text-gray-500">Model</p>
              <p className="font-semibold">{details.model}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Registration</p>
              <p className="font-semibold">{details.registration}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
            <p className="text-xs text-gray-400 col-span-2">FLIGHT INFO</p>
            <div>
              <p className="text-xs text-gray-500">Elapsed</p>
              <p className="font-semibold">{fmtDuration(elapsedMinutes)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="font-semibold">{fmtDuration(remainingMinutes)}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">PASSENGERS</p>
            <div className="flex justify-between text-sm mb-1">
              <span>{details.numberOfPassengers}</span>
              <span className="text-gray-500">/ {details.maxPassengers}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(details.numberOfPassengers / details.maxPassengers) * 100}%` }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
