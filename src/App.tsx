import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react'
import { Check, RotateCcw, Share2 } from 'lucide-react'
import RiskGrid from './RiskGrid'
import { cellsReducer, computeLockedConflictSet, initialCellsState } from './cellStateReducer'
import { getKeyAndExtraCodes } from './risks'
import { generateCode, type Difficulty } from './generateCode'
import { buildShareUrl, copyText, readShareSettingsFromHash, shareOrCopyUrl } from './share'
import Tooltip from './Tooltip'
import KofiButton from './KofiButton'
import githubIcon from './assets/github.svg'

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'normal', label: 'Normal' },
  { key: 'hard', label: 'Hard' },
]

function App() {
  const [state, dispatch] = useReducer(
    cellsReducer,
    undefined,
    () => initialCellsState(readShareSettingsFromHash()),
  )
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

  const keyExtraCodesSet = useMemo(() => new Set(getKeyAndExtraCodes()), [])

  const lockedConflictSet = useMemo(
    () => computeLockedConflictSet(state.lockedCodes),
    [state.lockedCodes],
  )

  const handleCellClick = useCallback(
    (code: string) => dispatch({ type: 'cellClick', code }),
    [],
  )

  const handleShare = useCallback(async () => {
    const url = buildShareUrl({
      difficulty: state.difficulty,
      useKey: state.useKey,
      lockedCodes: state.lockedCodes,
      bannedCodes: state.bannedCodes,
    })
    const result = await shareOrCopyUrl(url)
    if (result === 'aborted' || result === 'failed') return
    setShareStatus(result)
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShareStatus('idle'), 1500)
  }, [state.difficulty, state.useKey, state.lockedCodes, state.bannedCodes])

  const handleRandomize = useCallback(async () => {
    const generated = generateCode({
      difficulty: state.difficulty,
      useKey: state.useKey,
      locked: state.lockedCodes,
      banned: state.bannedCodes,
    })
    dispatch({ type: 'setRisk', risk: generated })
    if (await copyText(generated.code) !== 'copied') return
    setCopyStatus('copied')
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopyStatus('idle'), 1500)
  }, [state.difficulty, state.useKey, state.lockedCodes, state.bannedCodes])

  const handleHashChange = useCallback(() => {
    const settings = readShareSettingsFromHash()
    if (settings) dispatch({ type: 'applyShareSettings', settings })
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [handleHashChange])

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
        picks={state.risk?.picks}
        conflicts={state.risk?.conflicts}
        lockedCodes={state.lockedCodes}
        bannedCodes={state.bannedCodes}
        lockedConflictSet={lockedConflictSet}
        useKey={state.useKey}
        keyExtraCodes={keyExtraCodesSet}
        onCellClick={handleCellClick}
      />
      <div className="flex gap-2" role="group" aria-label="Difficulty">
        {DIFFICULTIES.map(({ key, label }) => {
          const selected = key === state.difficulty
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
              onClick={() => dispatch({ type: 'setDifficulty', difficulty: key })}
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
          aria-checked={state.useKey}
          aria-label="Key"
          className={[
            'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            state.useKey ? 'bg-key' : 'bg-white/20',
          ].join(' ')}
          onClick={() => dispatch({ type: 'toggleKey' })}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
              state.useKey ? 'translate-x-5' : 'translate-x-0',
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
            onClick={() => dispatch({ type: 'reset' })}
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
      <div className={`flex flex-col items-center gap-2 ${state.risk ? 'visible' : 'invisible'}`}>
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
          {state.risk?.code ?? '\u00A0'}
        </p>
        <p className="m-0 text-sm text-white/70">
          {state.risk ? `Level ${state.risk.level}` : '\u00A0'}
        </p>
      </div>
      <div className="self-center sm:fixed sm:bottom-6 sm:right-6 sm:z-50">
        <KofiButton kofiId="J7O022LHVW" />
      </div>
    </main>
  )
}

export default App
