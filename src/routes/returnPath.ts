import { roleHome } from '../app/authContext'

export function safeReturnPath(value: unknown, role: keyof typeof roleHome): string | null {
  if (typeof value !== 'string' || ([...value].some(char => char.charCodeAt(0) <= 32) || value.includes(String.fromCharCode(92)))) return null
  const home = roleHome[role]
  try {
    const url = new URL(value, 'https://craftlink.invalid')
    if (!value.startsWith('/') || url.origin !== 'https://craftlink.invalid') return null
    return url.pathname === home || url.pathname.startsWith(`${home}/`) ? url.pathname + url.search + url.hash : null
  } catch { return null }
}
