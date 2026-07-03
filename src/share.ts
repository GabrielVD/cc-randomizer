import type { Difficulty } from './generateCode'

export type ShareSettings = {
  difficulty: Difficulty
  useKey: boolean
  lockedCodes: string[]
  bannedCodes: string[]
}

const DIFFICULTY_TO_CHAR: Record<Difficulty, string> = {
  easy: 'e',
  normal: 'n',
  hard: 'h',
}

const CHAR_TO_DIFFICULTY: Record<string, Difficulty> = {
  e: 'easy',
  n: 'normal',
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

const CODE_LEN = 15
const ZERO_CODE = '0'.repeat(CODE_LEN)

function encodeCode(code: string): string {
  const index = code.search(/[^0]/)
  return index === -1 ? '' : `${code[index]}${index.toString(16)}`
}

function decodeCode(encoded: string): string {
  const c = encoded[0]
  const index = parseInt(encoded[1], 16)
  const chars = ZERO_CODE.split('')
  chars[index] = c
  return chars.join('')
}

function encodeCodes(codes: string[]): string {
  return codes.map(encodeCode).join('')
}

function decodeCodes(encoded: string): string[] {
  const codes: string[] = []
  for (let i = 0; i + 2 <= encoded.length; i += 2) {
    codes.push(decodeCode(encoded.slice(i, i + 2)))
  }
  return codes
}

export function encodeSettings(settings: ShareSettings): string {
  return toBase64Url(
    [
      DIFFICULTY_TO_CHAR[settings.difficulty],
      settings.useKey ? '1' : '0',
      encodeCodes(settings.lockedCodes),
      encodeCodes(settings.bannedCodes),
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
      lockedCodes: decodeCodes(l ?? ''),
      bannedCodes: decodeCodes(b ?? ''),
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
