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
    <section aria-labelledby="location-filter-title" className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-card">
      <h3 id="location-filter-title" className="text-lg">Location</h3>
      <p className="mt-1 text-sm text-ink-muted">Narrow results to a city or local government area.</p>
      <div className="mt-4 grid items-start gap-4 sm:grid-cols-2">
        <label htmlFor="location-state-select" className="grid gap-2 text-sm font-semibold">
          State
          <select
            id="location-state-select"
            name="state"
            value={selectedState}
            disabled
            aria-describedby="state-support-hint"
            className="min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface-muted px-3 py-2 text-ink-muted opacity-75 cursor-not-allowed"
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
            className="min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted"
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
