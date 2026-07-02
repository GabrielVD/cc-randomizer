import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildShareUrl,
  copyText,
  decodeSettings,
  encodeSettings,
  readShareSettingsFromHash,
  shareOrCopyUrl,
  type ShareSettings,
} from './share'

const SAMPLE: ShareSettings = {
  difficulty: 'hard',
  useKey: false,
  lockedCodes: ['000000000000001', '000000000000008'],
  bannedCodes: ['000000000000020'],
}

const toBase64Url = (str: string) =>
  btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

describe('encodeSettings / decodeSettings', () => {
  it('round-trips a full settings object', () => {
    expect(decodeSettings(encodeSettings(SAMPLE))).toEqual(SAMPLE)
  })

  it('round-trips empty code lists', () => {
    const settings: ShareSettings = {
      difficulty: 'easy',
      useKey: true,
      lockedCodes: [],
      bannedCodes: [],
    }
    expect(decodeSettings(encodeSettings(settings))).toEqual(settings)
  })

  it('round-trips every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const settings: ShareSettings = { difficulty, useKey: true, lockedCodes: [], bannedCodes: [] }
      expect(decodeSettings(encodeSettings(settings))).toEqual(settings)
    }
  })

  it('returns null for invalid base64', () => {
    expect(decodeSettings('!!!not-base64!!!')).toBeNull()
  })

  it('returns null for an unknown difficulty character', () => {
    expect(decodeSettings(toBase64Url('x|1||'))).toBeNull()
  })
})

describe('buildShareUrl', () => {
  it('embeds the encoded settings after the #/s= prefix', () => {
    const url = buildShareUrl(SAMPLE)
    expect(url).toContain('#/s=')
    expect(decodeSettings(url.slice(url.indexOf('#/s=') + 4))).toEqual(SAMPLE)
  })
})

describe('readShareSettingsFromHash', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('reads settings from the location hash', () => {
    const url = buildShareUrl(SAMPLE)
    window.location.hash = url.slice(url.indexOf('#'))
    expect(readShareSettingsFromHash()).toEqual(SAMPLE)
  })

  it('returns null when the hash has no share prefix', () => {
    window.location.hash = ''
    expect(readShareSettingsFromHash()).toBeNull()
  })
})

describe('copyText', () => {
  it('returns copied when clipboard.writeText succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    try {
      expect(await copyText('hello')).toBe('copied')
      expect(writeText).toHaveBeenCalledWith('hello')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('returns failed when clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    try {
      expect(await copyText('hello')).toBe('failed')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('returns failed when writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    try {
      expect(await copyText('hello')).toBe('failed')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('shareOrCopyUrl', () => {
  it('returns shared when navigator.share succeeds', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    try {
      expect(await shareOrCopyUrl('https://example.com')).toBe('shared')
      expect(share).toHaveBeenCalledWith({ url: 'https://example.com' })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('returns aborted when share throws AbortError', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'))
    vi.stubGlobal('navigator', { share })
    try {
      expect(await shareOrCopyUrl('https://example.com')).toBe('aborted')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('falls back to clipboard when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    try {
      expect(await shareOrCopyUrl('https://example.com')).toBe('copied')
      expect(writeText).toHaveBeenCalledWith('https://example.com')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('returns failed when neither share nor clipboard is available', async () => {
    vi.stubGlobal('navigator', {})
    try {
      expect(await shareOrCopyUrl('https://example.com')).toBe('failed')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
