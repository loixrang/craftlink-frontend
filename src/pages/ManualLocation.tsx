import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { locationKeys, locationSchema, readLocation, type LocationValues } from '../schemas/location'

export function ManualLocation() {
  const [params] = useSearchParams()
  return <LocationForm key={params.toString()} />
}

function LocationForm() {
  const [params, setParams] = useSearchParams()
  const location = readLocation(params)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { latitude: params.get('latitude') ?? '', longitude: params.get('longitude') ?? '', radiusKm: params.get('radiusKm') ?? '' },
  })
  return <section aria-labelledby="location-title" className="mt-6 border-y border-line py-6">
    <h3 id="location-title" className="text-lg">Search near a location</h3>
    <p id="location-help" className="mt-2 max-w-2xl text-sm text-ink-muted">Enter latitude and longitude from a map, then optionally limit the search radius. Use an area you are comfortable sharing: these coordinates appear in the page URL and browser history.</p>
    <form aria-label="Manual location" aria-describedby="location-help" noValidate className="mt-4 grid items-start gap-4 sm:grid-cols-3" onSubmit={handleSubmit(values => {
      const next = new URLSearchParams(params)
      for (const key of locationKeys) {
        if (values[key]) next.set(key, String(Number(values[key])))
        else next.delete(key)
      }
      next.delete('page')
      setParams(next)
    })}>
      <Input {...register('latitude')} label="Latitude" inputMode="decimal" hint="Between -90 and 90" error={errors.latitude?.message} required />
      <Input {...register('longitude')} label="Longitude" inputMode="decimal" hint="Between -180 and 180" error={errors.longitude?.message} required />
      <Input {...register('radiusKm')} label="Search radius (km)" inputMode="decimal" hint="Optional; greater than 0" error={errors.radiusKm?.message} />
      <div className="flex flex-wrap gap-3 sm:col-span-3">
        <Button type="submit">Apply location</Button>
        <Button variant="quiet" onClick={() => {
          reset({ latitude: '', longitude: '', radiusKm: '' })
          const next = new URLSearchParams(params)
          locationKeys.forEach(key => next.delete(key))
          next.delete('page')
          if (next.get('sort') === 'distance') next.delete('sort')
          setParams(next)
        }}>Clear location</Button>
      </div>
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm sm:col-span-3">Check the location fields before applying.</p>}
    </form>
    <p role="status" className="mt-3 text-sm text-ink-muted">{location.invalid
      ? 'The location in this link is invalid or incomplete and has been ignored. Enter both coordinates and a valid optional radius, or clear the location.'
      : location.filters.latitude !== undefined
        ? `Location applied: ${location.filters.latitude}, ${location.filters.longitude}${location.filters.radiusKm !== undefined ? ` within ${location.filters.radiusKm} km` : '. No radius limit selected'}.`
        : 'No location applied. Results are not limited to a nearby area.'}</p>
  </section>
}
