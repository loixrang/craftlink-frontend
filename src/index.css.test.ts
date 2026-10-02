import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const themeStart = css.indexOf('@theme {')
const themeEnd = css.indexOf('\n}', themeStart)
const outsideTheme = `${css.slice(0, themeStart)}${css.slice(themeEnd)}`
const theme = css.slice(themeStart, themeEnd)

describe('theme token ownership', () => {
  it('locates the @theme block', () => {
    expect(themeStart).toBeGreaterThan(-1)
    expect(themeEnd).toBeGreaterThan(themeStart)
  })

  it('declares theme colours only inside @theme so light-dark() keeps resolving', () => {
    expect(outsideTheme).not.toMatch(/--color-[\w-]+\s*:/)
  })

  it('only forces a colour scheme on the root element', () => {
    const forced = [...outsideTheme.matchAll(/([^{}]+)\{([^{}]*color-scheme\s*:\s*dark[^{}]*)\}/g)]
      .map(match => match[1]?.trim() ?? '')

    expect(forced).toEqual([':root.dark'])
  })

  it('gives every theme-aware token a light and a dark value', () => {
    const brandTokens = /^--(?:color-accent|color-accent-hover|color-on-accent)$/
    const declared = [...theme.matchAll(/(--(?:color|shadow)-[\w-]+)\s*:\s*([^;]+);/g)]
    const pinned = declared
      .filter(match => !brandTokens.test(match[1] ?? '') && !(match[2] ?? '').includes('light-dark('))
      .map(match => match[1])

    expect(declared.length).toBeGreaterThan(0)
    expect(pinned).toEqual([])
  })
})
