import { useCallback, useMemo, type CSSProperties } from 'react'
import Cell, { type CellState } from './Cell'
import { useDragScroll } from './useDragScroll'

type RiskGridProps = {
  picks?: string[]
  conflicts?: string[]
  lockedCodes?: string[]
  bannedCodes?: string[]
  lockedConflictSet?: Set<string>
  useKey?: boolean
  keyExtraCodes?: Set<string>
  onCellClick?: (code: string) => void
}

const ROWS = 3

// All grid dimensions are fixed ratios of the cell height, delivered via a
// single CSS custom property (`--cell-h`) set with clamp() on the grid root.
// jsdom cannot resolve clamp()/calc(); tests assert on these style strings.
const CELL_H = 'var(--cell-h)'
const ROW_HEIGHT = `calc(${CELL_H} * 61 / 45)`
const ROW_PADDING = `calc(${CELL_H} * 8 / 45)`
const ROW_GAP = `calc(${CELL_H} * 8 / 45)`
const CELL_GAP = `calc(${CELL_H} * 14 / 45)`
const HEADER_WIDTH = `calc(${CELL_H} * 0.41)`
const HEADER_FONT_SIZE = `calc(${CELL_H} * 0.18)`
const HEADER_ARROW = `calc(${CELL_H} * 0.13)`
const HEADER_PADDING_RIGHT = `calc(${CELL_H} * 0.088)`

const GRID_STYLE = { '--cell-h': 'clamp(56px, 12svh, 136px)' } as CSSProperties

const rowStyle: CSSProperties = {
  height: ROW_HEIGHT,
  padding: ROW_PADDING,
  gap: CELL_GAP,
}

export default function RiskGrid({
  picks,
  conflicts,
  lockedCodes,
  bannedCodes,
  lockedConflictSet,
  useKey = true,
  keyExtraCodes,
  onCellClick,
}: RiskGridProps) {
  const {
    containerRef,
    contentRef,
    movedRef,
    atStart,
    atEnd,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDragScroll()

  const pickSet = useMemo(() => new Set(picks), [picks])
  const conflictSet = useMemo(() => new Set(conflicts), [conflicts])
  const lockedSet = useMemo(() => new Set(lockedCodes), [lockedCodes])
  const bannedSet = useMemo(() => new Set(bannedCodes), [bannedCodes])
  const lockedConflicts = lockedConflictSet ?? EMPTY_SET
  const disabledCodes = keyExtraCodes ?? EMPTY_SET

  const handleCellClick = useCallback((code: string) => {
    if (movedRef.current) return
    onCellClick?.(code)
  }, [movedRef, onCellClick])

  return (
    <div className="flex w-max max-w-full gap-2" style={GRID_STYLE}>
      {/* Fixed row headers */}
      <div
        className="flex shrink-0 flex-col"
        style={{ gap: ROW_GAP }}
      >
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center bg-gradient-to-br from-white/15 to-white/5 font-bold text-white/80"
            style={{
              height: ROW_HEIGHT,
              width: HEADER_WIDTH,
              paddingRight: HEADER_PADDING_RIGHT,
              fontSize: HEADER_FONT_SIZE,
              clipPath:
                `polygon(0 0, calc(100% - ${HEADER_ARROW}) 0, 100% 50%, calc(100% - ${HEADER_ARROW}) 100%, 0 100%)`,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div ref={contentRef} className="flex w-max flex-col will-change-transform" style={{ gap: ROW_GAP }}>
          {riskCodes().map((rowCodes, row) => (
            <div
              key={row}
              className="flex rounded-xl border border-white/10 bg-white/5"
              style={rowStyle}
            >
              {rowCodes.map((riskCode, col) => {
                let state: CellState | undefined
                if (riskCode) {
                  if (!useKey && disabledCodes.has(riskCode)) state = 'conflict'
                  else if (lockedSet.has(riskCode)) state = 'locked'
                  else if (lockedConflicts.has(riskCode)) state = 'conflict'
                  else if (bannedSet.has(riskCode)) state = 'banned'
                  else if (pickSet.has(riskCode)) state = 'selected'
                  else if (conflictSet.has(riskCode)) state = 'conflict'
                  else state = 'unselected'
                }
                return (
                  <Cell
                    key={col}
                    riskCode={riskCode ?? undefined}
                    state={state}
                    onClick={handleCellClick}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent transition-opacity duration-150 sm:w-16"
          style={{ opacity: atStart ? 0 : 1 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent transition-opacity duration-150 sm:w-16"
          style={{ opacity: atEnd ? 0 : 1 }}
        />
      </div>
    </div>
  )
}

const EMPTY_SET = new Set<string>()

function riskCodes() {
  return [
    ['000000000000001', '000000000000008', '000000000000020', '0000000000000G0', '000000000000400', '000000000001000', '000000000008000', '000000000020000', '0000000000G0000', '000000000400000', '000000001000000', null             , null             ,  '0000000G0000000',  '000000400000000',  '000001000000000',  '000008000000000',  '000020000000000', '0000G0000000000', '000400000000000', '001000000000000',  '008000000000000',  null             ],
    ['000000000000002', '00000000000000G', '000000000000040', '000000000000100', '000000000000800', '000000000002000', null             , '000000000040000', '000000000100000', '000000000800000', '000000002000000', null             , null             ,  '000000100000000',  '000000800000000',  '000002000000000',  '00000G000000000',  '000040000000000', null             , null             , null             ,  '00G000000000000',  '040000000000000'],
    ['000000000000004', null             , '000000000000080', '000000000000200', null             , null             , '000000000010000', null             , null             , '000000000G00000', '000000004000000', '000000010000000', '000000080000000',  null             ,  null             ,  null             ,  null             ,  null             , null             , null             , null             ,  null             ,  '080000000000000'],
  ];
}
