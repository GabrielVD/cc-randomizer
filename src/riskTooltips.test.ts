import { describe, it, expect } from 'vitest'
import { riskData } from './risks'
import riskTooltips from './riskTooltips'

const allRisks = () =>
  [...riskData().free, riskData().key, ...riskData().extra].flatMap((g) => g.risks)

describe('riskTooltips', () => {
  it('has a non-empty tooltip for every risk code', () => {
    for (const r of allRisks()) {
      expect(riskTooltips[r.code]).toBeTruthy()
    }
  })

  it('has no tooltip keys that do not map to a known risk code', () => {
    const codes = new Set(allRisks().map((r) => r.code))
    for (const key of Object.keys(riskTooltips)) {
      expect(codes.has(key)).toBe(true)
    }
  })
})
