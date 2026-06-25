type CellProps = {
  height?: number
  className?: string
}

export default function Cell({ height = 45, className = '' }: CellProps) {
  return (
    <div
      className={`shrink-0 rounded-md bg-neutral-600 ${className}`}
      style={{ aspectRatio: '7 / 9', height: `${height}px` }}
    />
  )
}
