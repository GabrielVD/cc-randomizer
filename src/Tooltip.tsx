import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type TooltipProps = {
  id: string
  content: string
  triggerRef: React.RefObject<HTMLElement | null>
}

const GAP = 8
const MARGIN = 8

export default function Tooltip({ id, content, triggerRef }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const tipW = tooltip.offsetWidth
    const tipH = tooltip.offsetHeight
    let raf = 0

    const place = () => {
      const rect = trigger.getBoundingClientRect()
      const placeAbove = rect.top - tipH - GAP >= MARGIN
      const left = Math.max(
        MARGIN,
        Math.min(
          rect.left + rect.width / 2 - tipW / 2,
          window.innerWidth - tipW - MARGIN,
        ),
      )
      const top = placeAbove ? rect.top - tipH - GAP : rect.bottom + GAP
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
      tooltip.style.opacity = '1'
      raf = requestAnimationFrame(place)
    }
    place()

    return () => cancelAnimationFrame(raf)
  }, [triggerRef])

  return createPortal(
    <div
      id={id}
      ref={tooltipRef}
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-[260px] rounded-md bg-neutral-900 px-3 py-2 text-sm leading-snug text-white/90 opacity-0 shadow-lg ring-1 ring-white/10"
    >
      {content}
    </div>,
    document.body,
  )
}
