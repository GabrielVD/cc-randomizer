import { useId, useRef, useState, type CSSProperties } from 'react'
import { Lock } from 'lucide-react'
import { getKeyCodes, riskData, type RiskData, type RiskEdge } from "./risks"
import riskImages from "./riskImages"
import riskTooltips from "./riskTooltips"
import Tooltip from "./Tooltip"
import keyIcon from "./assets/key.svg"

export type CellState = 'empty' | 'selected' | 'unselected' | 'conflict' | 'locked' | 'banned'

type CellProps = {
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

const BASE_CELL_HEIGHT = 45
const ICON_RATIO = 0.22
const ICON_SIZE = `calc(var(--cell-h) * ${ICON_RATIO})`
// Edge thickness is a fixed 12px at the desktop cell height (135.7px); the
// ratio scales it with the cell on mobile.
const EDGE_THICKNESS_RATIO = 12 / 135.7
const THICKNESS_SIZE = `calc(var(--cell-h) * ${EDGE_THICKNESS_RATIO})`
// Edge gap is a fixed 5px at the desktop cell height (135.7px); the ratio
// scales it with the cell on mobile.
const EDGE_GAP_RATIO = 5 / 135.7

type EdgeOrientation = 'top' | 'left'
type EdgeGeometry = {
  path: string
  viewBox: string
  longSize: string
  orientation: EdgeOrientation
}

function buildEdgeGeometry(edge: Exclude<RiskEdge, 'none'>): EdgeGeometry {
  const edgeFactor = 0.45
  const baseLength = EDGE_LENGTHS[edge] * BASE_CELL_HEIGHT * edgeFactor
  const longRatio = EDGE_LENGTHS[edge] * edgeFactor
  const longSize = `calc(var(--cell-h) * ${longRatio})`
  if (edge === 'left') {
    const e = baseLength
    const path = `M0 0 L0 12 Q${e * 0.4} 6 ${e / 2} 7 Q${e * 0.6} 6 ${e} 12 L${e} 0 Q${e * 0.6} 6 ${e / 2} 5 Q${e * 0.4} 6 0 0 Z`
    return { path, viewBox: `0 0 ${e} 12`, longSize, orientation: 'left' }
  }
  const e = baseLength
  const path = `M0 0 L12 0 Q6 ${e * 0.4} 7 ${e / 2} Q6 ${e * 0.6} 12 ${e} L0 ${e} Q6 ${e * 0.6} 5 ${e / 2} Q6 ${e * 0.4} 0 0 Z`
  return { path, viewBox: `0 0 12 ${e}`, longSize, orientation: 'top' }
}

const EDGE_GEOMETRY: Record<Exclude<RiskEdge, 'none'>, EdgeGeometry> = {
  short: buildEdgeGeometry('short'),
  long: buildEdgeGeometry('long'),
  left: buildEdgeGeometry('left'),
}

const ROOT_STYLE: CSSProperties = { aspectRatio: '7 / 9', height: 'var(--cell-h)' }

const RISK_DATA_MAP = riskDataMap()
const KEY_CODES = new Set(getKeyCodes())

export default function Cell({
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
  const edge = riskData?.edge
  const geometry = edge && edge !== 'none' ? EDGE_GEOMETRY[edge] : undefined
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
      style={ROOT_STYLE}
      onClick={clickable && riskCode ? () => onClick?.(riskCode) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-describedby={hovered && tooltip ? tooltipId : undefined}
    >
      <div className={`absolute inset-0 rounded-md transition-[background-color,opacity] ${STATE_STYLES[state]} ${dimmed ? 'opacity-30' : ''}`}>
        {hasRisk && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-md p-3.5">
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
              style={{ height: ICON_SIZE }}
            />
          </div>
        )}
        {state === 'locked' && (
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-1 text-white"
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
          />
        )}
      </div>
      {geometry && (
        geometry.orientation === 'left' ? (
          <svg
            className="absolute left-0 top-1/2"
            style={{
              width: geometry.longSize,
              height: THICKNESS_SIZE,
              transform: `translate(calc(-100% - var(--cell-h) * ${EDGE_GAP_RATIO}), -50%)`,
            }}
            viewBox={geometry.viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={geometry.path} fill="white" />
          </svg>
        ) : (
          <svg
            className="absolute left-1/2 top-0"
            style={{
              width: THICKNESS_SIZE,
              height: geometry.longSize,
              transform: `translate(-50%, calc(-100% - var(--cell-h) * ${EDGE_GAP_RATIO}))`,
            }}
            viewBox={geometry.viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={geometry.path} fill="white" />
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
