import Cell from './Cell'
import { useDragScroll } from './useDragScroll'

const ROWS = 3
const CELLS_PER_ROW = 23
const GRID_HEIGHT = 600

const BASE_CELL_HEIGHT = 45
const BASE_ROW_PADDING = 8
const BASE_ROW_GAP = 8
const BASE_CELL_GAP = 6
const BASE_TOTAL =
  ROWS * (BASE_CELL_HEIGHT + 2 * BASE_ROW_PADDING) + (ROWS - 1) * BASE_ROW_GAP

const SCALE = GRID_HEIGHT / BASE_TOTAL
const CELL_HEIGHT = BASE_CELL_HEIGHT * SCALE
const ROW_PADDING = BASE_ROW_PADDING * SCALE
const ROW_GAP = BASE_ROW_GAP * SCALE
const CELL_GAP = BASE_CELL_GAP * SCALE
const ROW_HEIGHT = CELL_HEIGHT + 2 * ROW_PADDING

const rowStyle = { height: `${ROW_HEIGHT}px`, padding: `${ROW_PADDING}px`, gap: `${CELL_GAP}px` }

export default function RiskGrid() {
  const {
    containerRef,
    contentRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDragScroll()

  return (
    <div className="flex w-max max-w-full gap-2">
      {/* Fixed row headers */}
      <div
        className="flex shrink-0 flex-col"
        style={{ gap: `${ROW_GAP}px` }}
      >
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-white/70"
            style={{ height: `${ROW_HEIGHT}px`, width: '2rem' }}
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
        <div ref={contentRef} className="flex w-max flex-col will-change-transform" style={{ gap: `${ROW_GAP}px` }}>
          {Array.from({ length: ROWS }, (_, row) => (
            <div
              key={row}
              className="flex rounded-xl border border-white/10 bg-white/5"
              style={rowStyle}
            >
              {Array.from({ length: CELLS_PER_ROW }, (_, col) => (
                <Cell key={col} height={CELL_HEIGHT} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
