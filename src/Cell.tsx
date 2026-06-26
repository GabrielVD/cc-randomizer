export type CellState = 'empty' | 'selected' | 'unselected' | 'conflict' | 'locked' | 'banned'

export type Edge = 'none' | 'short' | 'long'

type CellProps = {
  height?: number
  className?: string
  state?: CellState
  riskCode?: string
  edge?: Edge
}

const STATE_STYLES: Record<CellState, string> = {
  empty: 'bg-neutral-600',
  unselected: 'bg-neutral-600 ring-1 ring-white/10',
  selected: 'bg-neutral-500 ring-2 ring-white',
  conflict: 'bg-neutral-600 ring-2 ring-red-500',
  locked: 'bg-neutral-600 ring-2 ring-blue-500',
  banned: 'bg-neutral-800 ring-2 ring-neutral-500',
}

const EDGE_LENGTHS: Record<Edge, number> = {
  none: 0,
  short: 1,
  long: 4
}

export default function Cell({
  height = 45,
  className = '',
  state = 'empty',
  riskCode,
  edge = 'none',
}: CellProps) {
  const hasRisk = state !== 'empty' && riskCode !== undefined
  const edgeLength = EDGE_LENGTHS[edge] * height * .45
  const showEdge = edgeLength > 0

  return (
    <div
      className={`relative shrink-0 rounded-md transition-colors ${STATE_STYLES[state]} ${className}`}
      style={{ aspectRatio: '7 / 9', height: `${height}px` }}
    >
      {hasRisk && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-md p-1">
          {/* TODO: replace with per-riskCode image */}
          <span className="break-all text-center font-mono text-[10px] leading-tight text-white/80">
            {riskCode}
          </span>
        </div>
      )}
      {state === 'banned' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <div className="absolute left-1/2 top-1/2 h-0.5 w-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-neutral-400" />
        </div>
      )}
      {showEdge && (
        <div
          className="absolute left-1/2 top-0 w-4 -translate-x-1/2 -translate-y-[calc(100%+5px)] rounded-full bg-white/60"
          style={{ height: `${edgeLength}px` }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
