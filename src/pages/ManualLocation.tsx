import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
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
  const request = useRef(0)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState('')
  useEffect(() => () => { request.current += 1 }, [])
  function cancelLocation() {
    request.current += 1
    setPending(false)
    setFeedback('')
  }
  const { register, handleSubmit, reset, setValue, clearErrors, formState: { errors } } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { latitude: params.get('latitude') ?? '', longitude: params.get('longitude') ?? '', radiusKm: params.get('radiusKm') ?? '' },
  })
  function locate() {
    if (pending) return
    if (!window.isSecureContext) {
      setFeedback('Browser location requires a secure connection. Enter coordinates manually below.')
      return
    }
    if (!navigator.geolocation) {
      setFeedback('This browser does not support location. Enter coordinates manually below.')
      return
    }
    const id = ++request.current
    setPending(true)
    setFeedback('Waiting for your browser location. You can cancel or enter coordinates manually below.')
    function fail(message: string) {
      if (request.current !== id) return
      request.current += 1
      setPending(false)
      setFeedback(message + ' Enter coordinates manually below, or try again.')
    }
    try {
      navigator.geolocation.getCurrentPosition(position => {
        if (request.current !== id) return
        const { latitude, longitude } = position.coords
        const parsed = locationSchema.safeParse({ latitude: String(latitude), longitude: String(longitude), radiusKm: '' })
        if (!parsed.success) {
          fail('Your browser returned an invalid location.')
          return
        }
        request.current += 1
        setPending(false)
        setValue('latitude', parsed.data.latitude, { shouldDirty: true })
        setValue('longitude', parsed.data.longitude, { shouldDirty: true })
        clearErrors(['latitude', 'longitude'])
        setFeedback('Browser location filled in. Review the coordinates and optional radius, then choose Apply location to search.')
      }, error => {
        fail(error.code === 1
          ? 'Location permission was denied. You can allow location in your browser settings.'
          : error.code === 3 ? 'Finding your location timed out.' : 'Your browser could not determine your location.')
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 })
    } catch {
      fail('Your browser could not request your location.')
    }
  }
  return <section aria-labelledby="location-title" className="mt-6 border-y border-line py-6">
    <h3 id="location-title" className="text-lg">Search near a location</h3>
    <p id="location-help" className="mt-2 max-w-2xl text-sm text-ink-muted">Enter latitude and longitude from a map, then optionally limit the search radius. Use an area you are comfortable sharing: these coordinates appear in the page URL and browser history.</p>
    <p id="browser-location-help" className="mt-2 max-w-2xl text-sm text-ink-muted">Use your browser location to fill the fields below. Your browser may ask permission. Coordinates are sent to Craftlink and added to the URL only when you apply them.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button variant="secondary" pending={pending} aria-describedby="browser-location-help" onClick={locate}><LocateFixed size={18} aria-hidden="true" />{pending ? 'Finding your location…' : 'Use my location'}</Button>
      {pending && <Button variant="quiet" onClick={() => { cancelLocation(); setFeedback('Location request cancelled. You can enter coordinates manually below.') }}>Cancel location request</Button>}
    </div>
    <p role="status" className="mt-3 text-sm text-ink-muted">{feedback}</p>
    <form aria-label="Manual location" aria-describedby="location-help" noValidate onChange={cancelLocation} className="mt-4 grid items-start gap-4 sm:grid-cols-3" onSubmit={event => { cancelLocation(); void handleSubmit(values => {
      const next = new URLSearchParams(params)
      for (const key of locationKeys) {
        if (values[key]) next.set(key, String(Number(values[key])))
        else next.delete(key)
      }
      next.delete('page')
      setParams(next)
    })(event) }}>
      <Input {...register('latitude')} label="Latitude" inputMode="decimal" hint="Between -90 and 90" error={errors.latitude?.message} required />
      <Input {...register('longitude')} label="Longitude" inputMode="decimal" hint="Between -180 and 180" error={errors.longitude?.message} required />
      <Input {...register('radiusKm')} label="Search radius (km)" inputMode="decimal" hint="Optional; greater than 0" error={errors.radiusKm?.message} />
      <div className="flex flex-wrap gap-3 sm:col-span-3">
        <Button type="submit">Apply location</Button>
        <Button variant="quiet" onClick={() => {
          cancelLocation()
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
