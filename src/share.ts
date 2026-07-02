import type { Difficulty } from './generateCode'

export type ShareSettings = {
  difficulty: Difficulty
  useKey: boolean
  lockedCodes: string[]
  bannedCodes: string[]
}

const DIFFICULTY_TO_CHAR: Record<Difficulty, string> = {
  easy: 'e',
  medium: 'm',
  hard: 'h',
}

const CHAR_TO_DIFFICULTY: Record<string, Difficulty> = {
  e: 'easy',
  m: 'medium',
  h: 'hard',
}

const HASH_PREFIX = '#/s='

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
}

export function encodeSettings(settings: ShareSettings): string {
  return toBase64Url(
    [
      DIFFICULTY_TO_CHAR[settings.difficulty],
      settings.useKey ? '1' : '0',
      settings.lockedCodes.join(','),
      settings.bannedCodes.join(','),
    ].join('|'),
  )
}

export function decodeSettings(encoded: string): ShareSettings | null {
  try {
    const [d, k, l, b] = fromBase64Url(encoded).split('|')
    const difficulty = CHAR_TO_DIFFICULTY[d]
    if (!difficulty) return null
    return {
      difficulty,
      useKey: k === '1',
      lockedCodes: l ? l.split(',') : [],
      bannedCodes: b ? b.split(',') : [],
    }
  } catch {
    return null
  }
}

export function buildShareUrl(settings: ShareSettings): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : 'https://cc-randomizer.example'
  return `${base}${HASH_PREFIX}${encodeSettings(settings)}`
}

export function readShareSettingsFromHash(): ShareSettings | null {
  if (typeof window === 'undefined') return null
  const { hash } = window.location
  if (!hash.startsWith(HASH_PREFIX)) return null
  return decodeSettings(hash.slice(HASH_PREFIX.length))
}

export type ShareResult = 'shared' | 'copied' | 'aborted' | 'failed'

export type CopyResult = 'copied' | 'failed'

/** Copy arbitrary text to the clipboard. */
export async function copyText(text: string): Promise<CopyResult> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}

/** Try the native Web Share sheet, falling back to the clipboard. */
export async function shareOrCopyUrl(url: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ url })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'aborted'
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}
