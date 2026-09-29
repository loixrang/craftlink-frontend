import { z } from 'zod'
import { DEFAULT_STATE, isValidLga, isValidState } from '../constants/locations'

export const locationSchema = z.object({
  state: z.string().trim().default(DEFAULT_STATE),
  city: z.string().trim().optional(),
  lga: z.string().trim().optional(),
})

export type LocationValues = z.infer<typeof locationSchema>
export const locationKeys = ['state', 'city', 'lga'] as const
export const allLocationKeys = ['state', 'city', 'lga', 'latitude', 'longitude', 'radiusKm'] as const

export interface LocationFilters {
  state?: string
  city?: string
  lga?: string
}

export function readLocation(params: URLSearchParams): {
  state: string
  city: string
  filters: { state?: string; city?: string }
  invalid: boolean
} {
  const rawState = params.get('state')?.trim()
  const rawCity = params.get('city')?.trim() || params.get('lga')?.trim() || ''

  const state = rawState || DEFAULT_STATE
  let invalid = false

  if (rawState && !isValidState(rawState)) {
    invalid = true
  }

  if (rawCity) {
    if (!isValidLga(state, rawCity)) {
      invalid = true
    }
  }

  const validCity = rawCity && isValidLga(state, rawCity) ? rawCity : ''
  const validState = isValidState(state) ? state : DEFAULT_STATE

  const filters: { state?: string; city?: string } = {
    state: validState,
  }
  if (validCity) {
    filters.city = validCity
  }

  return {
    state: validState,
    city: validCity,
    filters,
    invalid,
  }
}
