import { useId, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { getKeyCodes, riskData, type RiskData, type RiskEdge } from "./risks"
import riskImages from "./riskImages"
import riskTooltips from "./riskTooltips"
import Tooltip from "./Tooltip"
import keyIcon from "./assets/key.svg"

export type CellState = 'empty' | 'selected' | 'unselected' | 'conflict' | 'locked' | 'banned'

type CellProps = {
  height?: number
  className?: string
  state?: CellState
  riskCode?: string
  onClick?: (riskCode: string) => void
}

const STATE_STYLES: Record<CellState, string> = {
  empty: 'bg-cell-empty',
  unselected: 'bg-cell-unselected ring-1 ring-white/10',
  selected: 'bg-cell-selected ring-2 ring-white',
  conflict: 'bg-neutral-600',
  locked: 'bg-cell-selected ring-2 ring-white',
  banned: 'bg-neutral-800 ring-2 ring-neutral-500',
}

const EDGE_LENGTHS: Record<RiskEdge, number> = {
  none: 0,
  short: 1,
  long: 4.4,
  left: .5
}

const RISK_DATA_MAP = riskDataMap()
const KEY_CODES = new Set(getKeyCodes())

export default function Cell({
  height = 45,
  className = '',
  riskCode,
  state = 'empty',
  onClick,
}: CellProps) {
  const [hovered, setHovered] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const hasRisk = riskCode !== undefined
  const riskData = hasRisk ? RISK_DATA_MAP[riskCode] : undefined
  const image = hasRisk ? riskImages[riskCode!] : undefined
  const edgeLength = hasRisk ?
    EDGE_LENGTHS[riskData?.edge || 'none'] * height * .45 : 0
  const showEdge = edgeLength > 0
  const tooltip = hasRisk ? riskTooltips[riskCode!] : undefined
  const isKey = hasRisk && KEY_CODES.has(riskCode!)

  if (state === 'empty' && hasRisk) {
    state = 'unselected'
  }

  const clickable = hasRisk && state !== 'conflict'
  const dimmed = state === 'conflict'

  return (
    <>
    <div
      ref={rootRef}
      className={`relative shrink-0 ${clickable ? 'cursor-pointer' : ''} ${className}`}
      style={{ aspectRatio: '7 / 9', height: `${height}px` }}
      onClick={clickable && riskCode ? () => onClick?.(riskCode) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-describedby={hovered && tooltip ? tooltipId : undefined}
    >
      <div className={`absolute inset-0 rounded-md transition-[background-color,opacity] ${STATE_STYLES[state]} ${dimmed ? 'opacity-30' : ''}`}>
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
        {isKey && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
            <img
              src={keyIcon}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute bottom-1 -left-2"
              style={{ height: `${height * 0.22}px` }}
            />
          </div>
        )}
        {state === 'locked' && (
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-1 text-white"
            style={{ width: `${height * 0.22}px`, height: `${height * 0.22}px` }}
          />
        )}
      </div>
      {showEdge && (
        riskData?.edge === 'left' ? (
          <svg
            className="absolute left-0 top-1/2 -translate-x-[calc(100%+5px)] -translate-y-1/2"
            width={edgeLength}
            height={12}
            viewBox={`0 0 ${edgeLength} 12`}
            aria-hidden="true"
          >
            <path
              d={`M0 0 L0 12 Q${edgeLength * 0.4} 6 ${edgeLength / 2} 7 Q${edgeLength * 0.6} 6 ${edgeLength} 12 L${edgeLength} 0 Q${edgeLength * 0.6} 6 ${edgeLength / 2} 5 Q${edgeLength * 0.4} 6 0 0 Z`}
              fill="white"
            />
          </svg>
        ) : (
          <svg
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+5px)]"
            width={12}
            height={edgeLength}
            viewBox={`0 0 12 ${edgeLength}`}
            aria-hidden="true"
          >
            <path
              d={`M0 0 L12 0 Q6 ${edgeLength * 0.4} 7 ${edgeLength / 2} Q6 ${edgeLength * 0.6} 12 ${edgeLength} L0 ${edgeLength} Q6 ${edgeLength * 0.6} 5 ${edgeLength / 2} Q6 ${edgeLength * 0.4} 0 0 Z`}
              fill="white"
            />
          </svg>
        )
      )}
    </div>
    {hovered && tooltip && (
      <Tooltip id={tooltipId} content={tooltip} triggerRef={rootRef} />
    )}
    </>
  )
}

function riskDataMap(): Record<string, RiskData> {
  const risks = riskData();
  const map: Record<string, RiskData> = {};
  const allRisks = [...risks.free, risks.key, ...risks.extra];
  allRisks.flatMap((group) => group.risks)
    .forEach((risk) => { map[risk.code] = risk; });

  return map;
}
