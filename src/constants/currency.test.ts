import { expect, it } from 'vitest'
import { CURRENCY_CODE, CURRENCY_SYMBOL, formatCurrency } from './currency'

it('formats stored Naira amounts with the symbol and no trailing decimals', () => {
  expect(CURRENCY_CODE).toBe('NGN')
  expect(CURRENCY_SYMBOL).toBe('₦')
  expect(formatCurrency(50000)).toBe('₦50,000')
  expect(formatCurrency(5000)).toBe('₦5,000')
  expect(formatCurrency(150000)).toBe('₦150,000')
  expect(formatCurrency(0)).toBe('₦0')
  expect(formatCurrency(9999999999.99)).toBe('₦9,999,999,999.99')
  expect(formatCurrency(10.5)).toBe('₦10.5')
})
it('returns an empty string for absent or non-finite amounts instead of misleading currency text', () => {
  expect(formatCurrency(null)).toBe('')
  expect(formatCurrency(undefined)).toBe('')
  expect(formatCurrency(Number.NaN)).toBe('')
})
it('groups thousands and repeats results from a shared formatter instance', () => {
  expect(formatCurrency(1234567)).toBe('₦1,234,567')
  expect(formatCurrency(1234567)).toBe(formatCurrency(1234567))
  expect(formatCurrency(1234567)).not.toContain('.00')
})