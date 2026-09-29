export const DEFAULT_STATE = 'Akwa Ibom' as const

export const NIGERIA_STATES_LGAS: Record<string, readonly string[]> = {
  'Akwa Ibom': [
    'Abak',
    'Eastern Obolo',
    'Eket',
    'Esit Eket',
    'Essien Udim',
    'Etim Ekpo',
    'Etinan',
    'Ibeno',
    'Ibesikpo Asutan',
    'Ibiono-Ibom',
    'Ika',
    'Ikono',
    'Ikot Abasi',
    'Ikot Ekpene',
    'Ini',
    'Itu',
    'Mbo',
    'Mkpat-Enin',
    'Nsit-Atai',
    'Nsit-Ibom',
    'Nsit-Ubium',
    'Obot Akara',
    'Okobo',
    'Onna',
    'Oron',
    'Oruk Anam',
    'Udung-Uko',
    'Ukanafun',
    'Uruan',
    'Urue-Offong/Oruko',
    'Uyo',
  ],
} as const

export const SUPPORTED_STATES = ['Akwa Ibom'] as const
export type SupportedState = (typeof SUPPORTED_STATES)[number]

export function getLgasForState(state: string): readonly string[] {
  return NIGERIA_STATES_LGAS[state] ?? []
}

export function isValidState(state: string): boolean {
  return Object.prototype.hasOwnProperty.call(NIGERIA_STATES_LGAS, state)
}

export function isValidLga(state: string, lga: string): boolean {
  const lgas = getLgasForState(state)
  return lgas.includes(lga)
}
