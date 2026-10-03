export const CURRENCY_CODE = 'NGN' as const
export const CURRENCY_LOCALE = 'en-NG' as const
export const CURRENCY_SYMBOL = '₦'

const formatters = new Map<string, Intl.NumberFormat>()

export function currencyFormatter(code: string = CURRENCY_CODE) {
  const key = `${CURRENCY_LOCALE}:${code}`
  const cached = formatters.get(key)
  if (cached) return cached
  const formatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  formatters.set(key, formatter)
  return formatter
}

export function formatCurrency(amount: number | null | undefined, code: string = CURRENCY_CODE): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return ''
  return currencyFormatter(code).format(amount)
}