import { useSearchParams } from 'react-router-dom'
import { DEFAULT_STATE, getLgasForState, SUPPORTED_STATES } from '../constants/locations'
import { readLocation } from '../schemas/location'

export function ManualLocation() {
  const [params, setParams] = useSearchParams()
  const { state, city } = readLocation(params)

  const selectedState = state || DEFAULT_STATE
  const availableLgas = getLgasForState(selectedState)
  const isStateSelected = Boolean(selectedState && availableLgas.length > 0)

  function handleLgaChange(nextLga: string) {
    const next = new URLSearchParams(params)
    if (nextLga) {
      next.set('city', nextLga)
    } else {
      next.delete('city')
      next.delete('lga')
    }
    next.delete('page')
    setParams(next)
  }

  return (
    <section aria-labelledby="location-filter-title" className="mt-6 border-y border-line py-6">
      <h3 id="location-filter-title" className="text-lg">Location</h3>
      <div className="mt-4 grid items-start gap-4 sm:grid-cols-2">
        <label htmlFor="location-state-select" className="grid gap-2 text-sm font-semibold">
          State
          <select
            id="location-state-select"
            name="state"
            value={selectedState}
            disabled
            aria-describedby="state-support-hint"
            className="min-h-11 rounded-control border border-control-border bg-surface-muted px-3 py-2 text-ink-muted opacity-75 cursor-not-allowed"
          >
            {SUPPORTED_STATES.map(s => (
              <option key={s} value={s}>
                {s} (Supported)
              </option>
            ))}
          </select>
          <span id="state-support-hint" className="text-xs font-normal text-ink-muted">
            Currently available in Akwa Ibom State.
          </span>
        </label>

        <label htmlFor="location-lga-select" className="grid gap-2 text-sm font-semibold">
          City / LGA
          <select
            id="location-lga-select"
            name="city"
            value={city}
            disabled={!isStateSelected}
            onChange={e => handleLgaChange(e.target.value)}
            className="min-h-11 rounded-control border border-control-border bg-surface px-3 py-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted"
          >
            <option value="">Select city / LGA</option>
            {availableLgas.map(lga => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
