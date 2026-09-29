import { expect, it } from 'vitest'
import { reviewSchema } from './review'

it.each([0, 6, 2.5, NaN, Infinity])('rejects invalid rating %s', rating => {
  expect(reviewSchema.safeParse({ rating, comment: 'Good work' }).success).toBe(false)
})
it.each([1, 2, 3, 4, 5])('accepts rating %s and trims comments', rating => {
  expect(reviewSchema.parse({ rating, comment: '  Good work  ' })).toEqual({ rating, comment: 'Good work' })
})
it('rejects whitespace-only comments', () => {
  expect(reviewSchema.safeParse({ rating: 5, comment: '   ' }).success).toBe(false)
})
