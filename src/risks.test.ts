import { describe, it, expect } from 'vitest'
import { findRiskGroup, getKeyAndExtraCodes, getKeyCodes, riskData } from './risks'

const allRisks = () =>
  [...riskData().free, riskData().key, ...riskData().extra].flatMap((g) => g.risks)

describe('riskData', () => {
  it('returns free, key, and extra groups', () => {
    const data = riskData()
    expect(data.free.length).toBeGreaterThan(0)
    expect(data.key.risks).toHaveLength(2)
    expect(data.extra.length).toBeGreaterThan(0)
  })

  it('uses 15-character codes only', () => {
    for (const r of allRisks()) {
      expect(r.code).toHaveLength(15)
    }
  })

  it('has unique codes across all groups', () => {
    const codes = allRisks().map((r) => r.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('assigns a positive level to every risk', () => {
    for (const r of allRisks()) {
      expect(r.level).toBeGreaterThan(0)
    }
  })
})

describe('findRiskGroup', () => {
  it('finds the group containing a given free code', () => {
    const group = findRiskGroup('000000000000001')
    expect(group).toBeDefined()
    expect(group!.risks.some((r) => r.code === '000000000000001')).toBe(true)
  })

  it('finds the key group for a key code', () => {
    const group = findRiskGroup('000000010000000')
    expect(group).toBeDefined()
    expect(group!.risks).toHaveLength(2)
  })

  it('returns undefined for an unknown code', () => {
    expect(findRiskGroup('000000000000000')).toBeUndefined()
  })
})

describe('getKeyCodes', () => {
  it('returns the two key codes', () => {
    expect(getKeyCodes()).toEqual(['000000010000000', '000000080000000'])
  })
})

describe('getKeyAndExtraCodes', () => {
  it('includes all key and extra codes but no free codes', () => {
    const codes = new Set(getKeyAndExtraCodes())
    expect(codes.has('000000010000000')).toBe(true) // key
    expect(codes.has('000000080000000')).toBe(true) // key
    expect(codes.has('0000000G0000000')).toBe(true) // extra
    expect(codes.has('000000000000001')).toBe(false) // free
  })
})
