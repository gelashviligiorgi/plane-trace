import { useState } from 'react'
import { FlightMap } from './components/FlightMap'
import { PlaneDetailPanel } from './components/PlaneDetailPanel'
import { useBasicPlanes } from './hooks/useBasicPlanes'
import { usePlaneDetails } from './hooks/usePlaneDetails'
import { useInterpolatedPlanes } from './hooks/useInterpolatedPlanes'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rawPlanes = useBasicPlanes()
  const { details, error } = usePlaneDetails(selectedId)
  const planes = useInterpolatedPlanes(rawPlanes, details)

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <FlightMap
        planes={planes}
        selectedId={selectedId}
        details={details}
        onPlaneSelect={setSelectedId}
      />
      <PlaneDetailPanel
        details={details}
        error={error}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
