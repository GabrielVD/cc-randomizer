import { riskData, type RiskData, type RiskEdge } from "./risks"
import riskImages from "./riskImages"

export type CellState = 'empty' | 'selected' | 'unselected' | 'conflict' | 'locked' | 'banned'

type CellProps = {
  height?: number
  className?: string
  state?: CellState
  riskCode?: string
  onClick?: (riskCode: string) => void
}

const STATE_STYLES: Record<CellState, string> = {
  empty: 'bg-[#212121]',
  unselected: 'bg-[#141414] ring-1 ring-white/10',
  selected: 'bg-[#9c0508] ring-2 ring-white',
  conflict: 'bg-neutral-600 ring-2 ring-red-500',
  locked: 'bg-neutral-600 ring-2 ring-blue-500',
  banned: 'bg-neutral-800 ring-2 ring-neutral-500',
}

const EDGE_LENGTHS: Record<RiskEdge, number> = {
  none: 0,
  short: 1,
  long: 4.4,
  left: .5
}

const RISK_DATA_MAP = riskDataMap()

export default function Cell({
  height = 45,
  className = '',
  riskCode,
  state = 'empty',
  onClick,
}: CellProps) {
  const hasRisk = riskCode !== undefined
  const riskData = hasRisk ? RISK_DATA_MAP[riskCode] : undefined
  const image = hasRisk ? riskImages[riskCode!] : undefined
  const edgeLength = hasRisk ?
    EDGE_LENGTHS[riskData?.edge || 'none'] * height * .45 : 0
  const showEdge = edgeLength > 0

  if (state === 'empty' && hasRisk) {
    state = 'unselected'
  }

  const clickable = hasRisk && state !== 'conflict'
  const dimmed = state === 'conflict'

  return (
    <div
      className={`relative shrink-0 ${clickable ? 'cursor-pointer' : ''} ${className}`}
      style={{ aspectRatio: '7 / 9', height: `${height}px` }}
      onClick={clickable && riskCode ? () => onClick?.(riskCode) : undefined}
    >
      <div className={`absolute inset-0 rounded-md transition-colors ${STATE_STYLES[state]} ${dimmed ? 'opacity-30' : ''}`}>
        {hasRisk && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-md p-1">
            {image ? (
              <img
                src={image}
                alt={riskCode}
                className="object-contain"
                draggable={false}
              />
            ) : (
              <span className="break-all text-center font-mono text-[10px] leading-tight text-white/80">
                {riskCode}
              </span>
            )}
          </div>
        )}
        {state === 'banned' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
            <div className="absolute left-1/2 top-1/2 h-0.5 w-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-neutral-400" />
          </div>
        )}
      </div>
      {showEdge && (
        riskData?.edge === 'left' ? (
          <div
            className="absolute left-0 top-1/2 h-3 -translate-x-[calc(100%+5px)] -translate-y-1/2 rounded-full bg-white"
            style={{ width: `${edgeLength}px` }}
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute left-1/2 top-0 w-3 -translate-x-1/2 -translate-y-[calc(100%+5px)] rounded-full bg-white"
            style={{ height: `${edgeLength}px` }}
            aria-hidden="true"
          />
        )
      )}
    </div>
  )
}

function riskDataMap(): Record<string, RiskData> {
  const risks = riskData();
  const map: Record<string, RiskData> = {};
  const allRisks = [...risks.free, risks.key, ...risks.locked];
  allRisks.flatMap((group) => group.risks)
    .forEach((risk) => { map[risk.code] = risk; });

  return map;
}
