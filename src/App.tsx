import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, RotateCcw, Share2 } from 'lucide-react'
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
import { buildShareUrl, copyText, readShareSettingsFromHash, shareOrCopyUrl, type ShareSettings } from './share'
import Tooltip from './Tooltip'
import KofiButton from './KofiButton'
import githubIcon from './assets/github.svg'

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'normal', label: 'Normal' },
  { key: 'hard', label: 'Hard' },
]

function App() {
  const [initialSettings] = useState(readShareSettingsFromHash)
  const [difficulty, setDifficulty] = useState<Difficulty>(initialSettings?.difficulty ?? 'normal')
  const [risk, setRisk] = useState<GeneratedRisk | null>(null)
  const [useKey, setUseKey] = useState(initialSettings?.useKey ?? true)
  const [lockedCodes, setLockedCodes] = useState<string[]>(initialSettings?.lockedCodes ?? [])
  const [bannedCodes, setBannedCodes] = useState<string[]>(initialSettings?.bannedCodes ?? [])
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle')
  const shareTimerRef = useRef<number | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const copyTimerRef = useRef<number | null>(null)
  const [resetHovered, setResetHovered] = useState(false)
  const [shareHovered, setShareHovered] = useState(false)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const resetTooltipId = useId()
  const shareTooltipId = useId()

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
      if (currentState === 'conflict') return
      if (currentState === 'locked') {
        const newLocked = new Set(lockedSet)
        newLocked.delete(code)
        let newRisk = risk
        if (newRisk && !pickSet.has(code)) {
          newRisk = addRiskToCode(newRisk, code)
        }
        setLockedCodes([...newLocked])
        setRisk(newRisk)
        return
      }
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

  const handleRandomize = useCallback(async () => {
    const generated = generateCode({ difficulty, useKey, locked: lockedCodes, banned: bannedCodes })
    setRisk(generated)
    if (await copyText(generated.code) !== 'copied') return
    setCopyStatus('copied')
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopyStatus('idle'), 1500)
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
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
  }, [])

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center-safe gap-6 px-4 py-8 sm:px-8 sm:py-2 lg:px-20">
      <a
        href="https://github.com/GabrielVD/cc-randomizer"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="absolute top-4 right-4 flex cursor-pointer items-center opacity-50 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-6 sm:right-6"
      >
        <img
          src={githubIcon}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-6 w-6 sm:h-7 sm:w-7"
        />
      </a>
      <header className="flex flex-col items-center gap-2 pt-10 sm:pt-0">
        <h1 className="m-0 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">CC Randomizer</h1>
        <p className="m-0 max-w-prose px-2 text-center text-sm text-white/60">
          Click on a cell to ban or lock it. Easy will select fewer risks, while Hard will select more.
        </p>
      </header>
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
                  ? 'bg-white text-black hover:bg-white/90'
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
        <span>Key Criteria</span>
        <button
          type="button"
          role="switch"
          aria-checked={useKey}
          aria-label="Key"
          className={[
            'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            useKey ? 'bg-key' : 'bg-white/20',
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
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <div className="flex justify-self-end">
          <button
            type="button"
            aria-label="Reset"
            aria-describedby={resetHovered ? resetTooltipId : undefined}
            ref={resetButtonRef}
            className="flex cursor-pointer items-center gap-2 text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onMouseEnter={() => setResetHovered(true)}
            onMouseLeave={() => setResetHovered(false)}
            onClick={() => {
              setRisk(null)
              setLockedCodes([])
              setBannedCodes([])
            }}
          >
            <RotateCcw className="h-7 w-7" />
          </button>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-randomize px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-randomize-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-8"
          onClick={handleRandomize}
        >
          Randomize
        </button>
        <div className="min-w-16 justify-self-start">
          {shareStatus === 'idle' ? (
            <button
              type="button"
              aria-label="Share"
              aria-describedby={shareHovered ? shareTooltipId : undefined}
              ref={shareButtonRef}
              className="flex cursor-pointer items-center gap-2 text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onMouseEnter={() => setShareHovered(true)}
              onMouseLeave={() => setShareHovered(false)}
              onClick={handleShare}
            >
              <Share2 className="h-7 w-7" />
            </button>
          ) : (
            <span
              aria-label={shareStatus === 'copied' ? 'Copied' : 'Shared'}
              className="flex items-center gap-1 text-sm font-semibold text-white"
            >
              <Check className="h-5 w-5" />
              {shareStatus === 'copied' ? 'Copied!' : 'Shared!'}
            </span>
          )}
        </div>
      </div>
      {resetHovered && (
        <Tooltip id={resetTooltipId} content="Reset all cells" triggerRef={resetButtonRef} />
      )}
      {shareHovered && shareStatus === 'idle' && (
        <Tooltip id={shareTooltipId} content="Share a link to this setup" triggerRef={shareButtonRef} />
      )}
      <div className={`flex flex-col items-center gap-2 ${risk ? 'visible' : 'invisible'}`}>
        <div className="flex h-1 items-center">
          {copyStatus === 'copied' && (
            <span
              role="status"
              className="-translate-y-1 flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-white"
            >
              <Check className="h-5 w-5" />
              Copied!
            </span>
          )}
        </div>
        <p className="m-0 font-mono text-xl tracking-wider text-white">
          {risk?.code ?? '\u00A0'}
        </p>
        <p className="m-0 text-sm text-white/70">
          {risk ? `Level ${risk.level}` : '\u00A0'}
        </p>
      </div>
      <div className="self-center sm:fixed sm:bottom-6 sm:right-6 sm:z-50">
        <KofiButton kofiId="J7O022LHVW" />
      </div>
    </main>
  )
}

export default App
