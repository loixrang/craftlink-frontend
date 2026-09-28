import { z } from 'zod'

const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/
function coordinate(label: string, min: number, max: number) {
  return z.string().trim().refine(value => decimal.test(value) && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max,
    `${label} must be a number from ${min} to ${max}.`)
}

export const locationSchema = z.object({
  latitude: coordinate('Latitude', -90, 90),
  longitude: coordinate('Longitude', -180, 180),
  radiusKm: z.string().trim().refine(value => value === '' || (decimal.test(value) && Number.isFinite(Number(value)) && Number(value) > 0), 'Enter a radius greater than 0 km, or leave it blank.'),
})
export type LocationValues = z.infer<typeof locationSchema>
export const locationKeys = ['latitude', 'longitude', 'radiusKm'] as const

export function readLocation(params: URLSearchParams) {
  const values = Object.fromEntries(locationKeys.map(key => [key, params.get(key) ?? '']))
  const parsed = locationSchema.safeParse(values)
  const present = locationKeys.some(key => params.has(key))
  if (!present || !parsed.success) return { filters: {}, invalid: present }
  return {
    filters: {
      latitude: Number(parsed.data.latitude), longitude: Number(parsed.data.longitude),
      radiusKm: parsed.data.radiusKm ? Number(parsed.data.radiusKm) : undefined,
    },
    invalid: false,
  }
}
