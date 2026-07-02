import { describe, it, expect } from 'vitest'
import {
  addRiskToCode,
  generateCode,
  removeRiskFromCode,
  type GeneratedRisk,
} from './generateCode'
import { riskData } from './risks'

const CODE_LEN = 15
const DIGITS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const LEVEL_MAP: Record<string, number> = Object.fromEntries(
  [...riskData().free, riskData().key, ...riskData().extra]
    .flatMap((g) => g.risks)
    .map((r) => [r.code, r.level]),
)

const EMPTY: GeneratedRisk = { code: '000000000000000', level: 0, picks: [], conflicts: [] }

const KEY_CODES = ['000000010000000', '000000080000000']

describe('generateCode', () => {
  it('always returns a 15-character code', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode().code).toHaveLength(CODE_LEN)
    }
  })

  it('uses only valid digit characters', () => {
    for (const ch of generateCode().code) {
      expect(DIGITS).toContain(ch)
    }
  })

  it('includes all locked codes in picks', () => {
    const locked = ['000000000000001', '000000000000008']
    const result = generateCode({ locked })
    for (const code of locked) {
      expect(result.picks).toContain(code)
    }
  })

  it('never includes banned codes in picks', () => {
    const banned = ['000000000000001', '000000000000008', '000000000000020']
    for (let i = 0; i < 50; i++) {
      const result = generateCode({ banned })
      for (const code of banned) {
        expect(result.picks).not.toContain(code)
      }
    }
  })

  it('always picks a key when useKey is true', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateCode({ useKey: true })
      expect(result.picks.some((c) => KEY_CODES.includes(c))).toBe(true)
    }
  })

  it('never picks a key when useKey is false', () => {
    const keySet = new Set(KEY_CODES)
    for (let i = 0; i < 50; i++) {
      const result = generateCode({ useKey: false })
      for (const c of result.picks) {
        expect(keySet.has(c)).toBe(false)
      }
    }
  })

  it('never picks extra risks when useKey is false', () => {
    const extraSet = new Set([
      '0000000G0000000',
      '000000100000000',
      '000000400000000',
      '000000800000000',
    ])
    for (let i = 0; i < 50; i++) {
      const result = generateCode({ useKey: false })
      for (const c of result.picks) {
        expect(extraSet.has(c)).toBe(false)
      }
    }
  })

  it('locks the requested key when a key is locked', () => {
    const result = generateCode({ useKey: true, locked: ['000000010000000'] })
    expect(result.picks).toContain('000000010000000')
  })

  it('reports sibling risks as conflicts when a risk is locked', () => {
    const result = generateCode({ locked: ['000000000000001'] })
    expect(result.conflicts).toContain('000000000000002')
    expect(result.conflicts).toContain('000000000000004')
  })

  it('produces a level equal to the sum of picked risk levels', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateCode()
      const sum = result.picks.reduce((acc, c) => acc + (LEVEL_MAP[c] ?? 0), 0)
      expect(result.level).toBe(sum)
    }
  })
})

describe('addRiskToCode', () => {
  it('adds a single risk digit and level to an empty code', () => {
    const result = addRiskToCode(EMPTY, '000000000000001')
    expect(result.code).toBe('000000000000001')
    expect(result.level).toBe(1)
    expect(result.picks).toEqual(['000000000000001'])
  })

  it('stacks digits at the same position', () => {
    const result = ['000000000000001', '000000000000002', '000000000000004'].reduce(
      addRiskToCode,
      EMPTY,
    )
    expect(result.code).toBe('000000000000007')
    expect(result.level).toBe(1 + 2 + 3)
    expect(result.picks).toHaveLength(3)
  })

  it('returns the risk unchanged for an unknown code', () => {
    expect(addRiskToCode(EMPTY, '000000000000000')).toBe(EMPTY)
  })
})

describe('removeRiskFromCode', () => {
  it('reverses addRiskToCode', () => {
    const added = addRiskToCode(EMPTY, '000000000000008')
    const removed = removeRiskFromCode(added, '000000000000008')
    expect(removed.code).toBe(EMPTY.code)
    expect(removed.level).toBe(EMPTY.level)
    expect(removed.picks).toEqual(EMPTY.picks)
  })

  it('removes only the requested pick', () => {
    const a = addRiskToCode(EMPTY, '000000000000008')
    const b = addRiskToCode(a, '000000000000001')
    const removed = removeRiskFromCode(b, '000000000000001')
    expect(removed.picks).toEqual(['000000000000008'])
    expect(removed.code).toBe('000000000000008')
    expect(removed.level).toBe(1)
  })

  it('returns the risk unchanged for an unknown code', () => {
    expect(removeRiskFromCode(EMPTY, '000000000000000')).toBe(EMPTY)
  })
})
