import Cell from './Cell'
import { useDragScroll } from './useDragScroll'

const ROWS = 3
const CELLS_PER_ROW = 23
const GRID_HEIGHT = 600

const BASE_CELL_HEIGHT = 45
const BASE_ROW_PADDING = 8
const BASE_ROW_GAP = 8
const BASE_CELL_GAP = 14
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
          {riskCodes().map((rowCodes, row) => (
            <div
              key={row}
              className="flex rounded-xl border border-white/10 bg-white/5"
              style={rowStyle}
            >
              {rowCodes.map((riskCode, col) => (
                <Cell key={col} height={CELL_HEIGHT} riskCode={riskCode ?? undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function riskCodes() {
  return [
    ['000000000000001', '000000000000008', '000000000000020', '0000000000000G0', '000000000000400', '000000000001000', '000000000008000', '000000000020000', '0000000000G0000', '000000000400000', '000000001000000', null             , null             ,  '0000000G0000000',  '000000400000000',  '000001000000000',  '000008000000000',  '000020000000000', '0000G0000000000', '000400000000000', '001000000000000',  '008000000000000',  null             ],
    ['000000000000002', '00000000000000G', '000000000000040', '000000000000100', '000000000000800', '000000000002000', null             , '000000000040000', '000000000100000', '000000000800000', '000000002000000', null             , null             ,  '000000100000000',  '000000800000000',  '000002000000000',  '00000G000000000',  '000040000000000', null             , null             , null             ,  '00G000000000000',  '040000000000000'],
    ['000000000000004', null             , '000000000000080', '000000000000200', null             , null             , '000000000010000', null             , null             , '000000000G00000', '000000004000000', '000000010000000', '000000080000000',  null             ,  null             ,  null             ,  null             ,  null             , null             , null             , null             ,  null             ,  '080000000000000'],
  ];
}
