import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import RiskGrid from './RiskGrid'
import { type CellState } from './Cell'
import { findRiskGroup, getKeyAndExtraCodes, getKeyCodes } from './risks'
import {
  addRiskToCode,
  generateCode,
  removeRiskFromCode,
  type Difficulty,
  type GeneratedRisk,
} from './generateCode'
import { buildShareUrl, readShareSettingsFromHash, shareOrCopyUrl, type ShareSettings } from './share'

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

function App() {
  const [initialSettings] = useState(readShareSettingsFromHash)
  const [difficulty, setDifficulty] = useState<Difficulty>(initialSettings?.difficulty ?? 'medium')
  const [risk, setRisk] = useState<GeneratedRisk | null>(null)
  const [useKey, setUseKey] = useState(initialSettings?.useKey ?? true)
  const [lockedCodes, setLockedCodes] = useState<string[]>(initialSettings?.lockedCodes ?? [])
  const [bannedCodes, setBannedCodes] = useState<string[]>(initialSettings?.bannedCodes ?? [])
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle')
  const shareTimerRef = useRef<number | null>(null)

  const keyCodesSet = useMemo(() => new Set(getKeyCodes()), [])
  const keyExtraCodesSet = useMemo(() => new Set(getKeyAndExtraCodes()), [])

  const lockedConflictSet = useMemo(() => {
    const set = new Set<string>()
    const lockedSet = new Set(lockedCodes)
    for (const lockedCode of lockedCodes) {
      const group = findRiskGroup(lockedCode)
      if (!group) continue
      for (const r of group.risks) {
        if (r.code !== lockedCode && !lockedSet.has(r.code) && !keyCodesSet.has(r.code)) {
          set.add(r.code)
        }
      }
    }
    return set
  }, [lockedCodes, keyCodesSet])

  const handleCellClick = useCallback((code: string) => {
    if (!useKey && keyExtraCodesSet.has(code)) return

    const lockedSet = new Set(lockedCodes)
    const bannedSet = new Set(bannedCodes)
    const pickSet = new Set(risk?.picks)
    const conflictSet = new Set(risk?.conflicts)

    let currentState: CellState
    if (lockedSet.has(code)) currentState = 'locked'
    else if (lockedConflictSet.has(code)) currentState = 'conflict'
    else if (bannedSet.has(code)) currentState = 'banned'
    else if (pickSet.has(code)) currentState = 'selected'
    else if (conflictSet.has(code)) currentState = 'conflict'
    else currentState = 'unselected'

    if (keyCodesSet.has(code)) {
      if (currentState === 'locked' || currentState === 'conflict') return
      const group = findRiskGroup(code)
      const otherKeyCodes = group?.risks
        .filter(r => r.code !== code)
        .map(r => r.code) ?? []
      const newLocked = new Set(lockedSet)
      const newBanned = new Set(bannedSet)
      let newRisk = risk
      newLocked.add(code)
      for (const c of otherKeyCodes) {
        newLocked.delete(c)
        newBanned.delete(c)
      }
      if (newRisk) {
        for (const c of otherKeyCodes) {
          if (pickSet.has(c)) newRisk = removeRiskFromCode(newRisk, c)
        }
        if (!pickSet.has(code)) newRisk = addRiskToCode(newRisk, code)
      }
      setLockedCodes([...newLocked])
      setBannedCodes([...newBanned])
      setRisk(newRisk)
      return
    }

    let newState: CellState
    if (currentState === 'unselected' || currentState === 'selected') newState = 'banned'
    else if (currentState === 'banned') newState = 'locked'
    else if (currentState === 'locked') newState = 'unselected'
    else return

    const newLocked = new Set(lockedSet)
    const newBanned = new Set(bannedSet)
    let newRisk = risk

    const group = findRiskGroup(code)
    const otherGroupCodes = group?.risks
      .filter(r => r.code !== code)
      .map(r => r.code) ?? []

    if (newState === 'banned') {
      newBanned.add(code)
      if (currentState === 'selected' && newRisk) {
        newRisk = removeRiskFromCode(newRisk, code)
        newRisk = {
          ...newRisk,
          conflicts: newRisk.conflicts.filter(c => !otherGroupCodes.includes(c)),
        }
      }
    } else if (newState === 'locked') {
      newBanned.delete(code)
      newLocked.add(code)
      for (const c of otherGroupCodes) {
        newBanned.delete(c)
      }
      if (newRisk) {
        for (const c of otherGroupCodes) {
          if (pickSet.has(c)) {
            newRisk = removeRiskFromCode(newRisk, c)
          }
        }
        newRisk = addRiskToCode(newRisk, code)
      }
    } else {
      // locked → unselected
      newLocked.delete(code)
      if (newRisk) {
        newRisk = removeRiskFromCode(newRisk, code)
        newRisk = {
          ...newRisk,
          conflicts: newRisk.conflicts.filter(c => !otherGroupCodes.includes(c)),
        }
      }
    }

    setLockedCodes([...newLocked])
    setBannedCodes([...newBanned])
    setRisk(newRisk)
  }, [lockedCodes, bannedCodes, risk, lockedConflictSet, useKey, keyCodesSet, keyExtraCodesSet])

  const handleShare = useCallback(async () => {
    const url = buildShareUrl({ difficulty, useKey, lockedCodes, bannedCodes })
    const result = await shareOrCopyUrl(url)
    if (result === 'aborted' || result === 'failed') return
    setShareStatus(result)
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShareStatus('idle'), 1500)
  }, [difficulty, useKey, lockedCodes, bannedCodes])

  const applyShareSettings = useCallback((settings: ShareSettings) => {
    setDifficulty(settings.difficulty)
    setUseKey(settings.useKey)
    setLockedCodes(settings.lockedCodes)
    setBannedCodes(settings.bannedCodes)
    setRisk(null)
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const settings = readShareSettingsFromHash()
      if (settings) applyShareSettings(settings)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [applyShareSettings])

  useEffect(() => () => {
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current)
  }, [])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-40">
      <RiskGrid
        picks={risk?.picks}
        conflicts={risk?.conflicts}
        lockedCodes={lockedCodes}
        bannedCodes={bannedCodes}
        lockedConflictSet={lockedConflictSet}
        useKey={useKey}
        keyExtraCodes={keyExtraCodesSet}
        onCellClick={handleCellClick}
      />
      <div className="flex gap-2" role="group" aria-label="Difficulty">
        {DIFFICULTIES.map(({ key, label }) => {
          const selected = key === difficulty
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              className={[
                'cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                selected
                  ? 'bg-randomize text-white hover:bg-randomize-hover'
                  : 'bg-white/10 text-white/70 hover:bg-white/20',
              ].join(' ')}
              onClick={() => {
                setDifficulty(key)
                setRisk(null)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
        <span>Key</span>
        <button
          type="button"
          role="switch"
          aria-checked={useKey}
          aria-label="Key"
          className={[
            'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            useKey ? 'bg-randomize' : 'bg-white/20',
          ].join(' ')}
          onClick={() => {
            const next = !useKey
            setUseKey(next)
            setRisk(null)
            if (!next) {
              const keyExtra = keyExtraCodesSet
              setLockedCodes(prev => prev.filter(c => !keyExtra.has(c)))
              setBannedCodes(prev => prev.filter(c => !keyExtra.has(c)))
            }
          }}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
              useKey ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </label>
      <div className="relative">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-randomize px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-randomize-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={() => setRisk(generateCode({ difficulty, useKey, locked: lockedCodes, banned: bannedCodes }))}
        >
          Randomize
        </button>
        <button
          type="button"
          aria-label={shareStatus === 'idle' ? 'Share' : shareStatus === 'copied' ? 'Copied' : 'Shared'}
          className="absolute left-full top-1/2 ml-3 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={handleShare}
        >
          {shareStatus === 'idle' ? <Share2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          {shareStatus === 'idle' ? 'Share' : shareStatus === 'copied' ? 'Copied!' : 'Shared!'}
        </button>
      </div>
      <div className={`flex flex-col items-center gap-2 ${risk ? 'visible' : 'invisible'}`}>
        <div className="relative">
          <p className="m-0 font-mono text-xl tracking-wider text-white">
            {risk?.code ?? '\u00A0'}
          </p>
          <button
            type="button"
            aria-label="Clear"
            className="absolute left-full top-1/2 ml-3 -translate-y-1/2 cursor-pointer text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => {
              setRisk(null)
              setLockedCodes([])
              setBannedCodes([])
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <p className="m-0 text-sm text-white/70">
          {risk ? `Level ${risk.level}` : '\u00A0'}
        </p>
      </div>
    </main>
  )
}

export default App
