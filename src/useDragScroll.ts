import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

// Timing
const FRAME_MS = 1000 / 60

// Momentum (within bounds)
const FRICTION = 0.94 // velocity retained per frame
const STOP_THRESHOLD = 0.3 // px/frame; below this momentum ends

// Overscroll bounce-back (beyond bounds)
const SPRING_K = 0.1 // spring stiffness per frame
const SPRING_DAMPING = 0.5 // velocity retained per frame while springing
const SETTLE_THRESHOLD = 0.5 // px; snap distance to bound

// Drag overscroll resistance: fraction of motion applied beyond the edges.
const RESISTANCE = 0.35

// Velocity sampling for momentum on release
const SAMPLE_WINDOW_MS = 100
const MAX_VELOCITY = 40 // px/frame; clamp flicks to a sane speed

type Sample = { t: number; x: number }

type State = {
  pointerId: number
  active: boolean
  moved: boolean
  startX: number
  startScroll: number
  maxScroll: number
  velocity: number
  lastTime: number
  rafId: number | null
  samples: Sample[]
}

/**
 * Click-and-drag horizontal scrolling with overscroll resistance and momentum,
 * mimicking touch scrolling on mobile apps. The transform is applied directly to
 * the content element for smooth 60fps motion without React re-renders.
 */
export function useDragScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(0)
  const stateRef = useRef<State>({
    pointerId: -1,
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    maxScroll: 0,
    velocity: 0,
    lastTime: 0,
    rafId: null,
    samples: [],
  })

  const apply = useCallback(() => {
    const el = contentRef.current
    if (el) el.style.transform = `translate3d(${-scrollRef.current}px,0,0)`
  }, [])

  const cancelRaf = useCallback(() => {
    const s = stateRef.current
    if (s.rafId !== null) {
      cancelAnimationFrame(s.rafId)
      s.rafId = null
    }
  }, [])

  const measure = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const max = Math.max(0, content.offsetWidth - container.clientWidth)
    stateRef.current.maxScroll = max
    const clamped = Math.min(Math.max(0, scrollRef.current), max)
    if (clamped !== scrollRef.current) {
      scrollRef.current = clamped
      apply()
    }
  }, [apply])

  // The animation loop is kept in a ref so it can reschedule itself without
  // referencing its own binding before declaration (react-hooks/immutability).
  const loopRef = useRef<FrameRequestCallback>(() => {})
  const loop = useCallback(
    (now: number) => {
      const s = stateRef.current
      const last = s.lastTime || now
      let dt = now - last
      s.lastTime = now
      if (dt <= 0) dt = FRAME_MS
      if (dt > 100) dt = FRAME_MS // ignore gaps (e.g. tab was hidden)
      const frame = Math.min(dt / FRAME_MS, 3)

      const max = s.maxScroll
      let scroll = scrollRef.current
      let v = s.velocity

      if (scroll < 0 || scroll > max) {
        // Spring back toward the nearest bound.
        const target = scroll < 0 ? 0 : max
        v += (target - scroll) * SPRING_K * frame
        v *= Math.pow(SPRING_DAMPING, frame)
        const next = scroll + v * frame
        // The moment we reach the edge, snap to it and stop
        const fromLeft = scroll < 0
        const reachedEdge = fromLeft ? next >= 0 : next <= max
        if (
          reachedEdge ||
          (Math.abs(next - target) < SETTLE_THRESHOLD && Math.abs(v) < STOP_THRESHOLD)
        ) {
          scrollRef.current = target
          s.velocity = 0
          s.rafId = null
          apply()
          return
        }
        scroll = next
      } else {
        // Free momentum with friction.
        scroll += v * frame
        v *= Math.pow(FRICTION, frame)
        if (Math.abs(v) < STOP_THRESHOLD && scroll >= 0 && scroll <= max) {
          scrollRef.current = scroll
          s.velocity = 0
          s.rafId = null
          apply()
          return
        }
      }

      scrollRef.current = scroll
      s.velocity = v
      apply()
      s.rafId = requestAnimationFrame(loopRef.current)
    },
    [apply],
  )
  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const container = containerRef.current
      if (!container) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      cancelRaf()
      const s = stateRef.current
      const now = performance.now()
      s.active = true
      s.moved = false
      s.pointerId = e.pointerId
      s.startX = e.clientX
      s.startScroll = scrollRef.current
      s.velocity = 0
      s.samples = [{ t: now, x: scrollRef.current }]
      container.setPointerCapture(e.pointerId)
    },
    [cancelRaf],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const s = stateRef.current
      if (!s.active || e.pointerId !== s.pointerId) return
      const delta = s.startX - e.clientX
      if (!s.moved && Math.abs(delta) < 3) return
      s.moved = true

      const max = s.maxScroll
      let target = s.startScroll + delta
      if (target < 0) target = target * RESISTANCE
      else if (target > max) target = max + (target - max) * RESISTANCE

      scrollRef.current = target
      const now = performance.now()
      s.samples.push({ t: now, x: target })
      while (s.samples.length > 2 && s.samples[0].t < now - SAMPLE_WINDOW_MS) {
        s.samples.shift()
      }
      apply()
    },
    [apply],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const s = stateRef.current
      if (!s.active || e.pointerId !== s.pointerId) return
      s.active = false
      const container = containerRef.current
      if (container?.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId)
      }

      // Derive release velocity from the recent sample window.
      const samples = s.samples
      let v = 0
      if (samples.length >= 2) {
        const first = samples[0]
        const last = samples[samples.length - 1]
        const dt = last.t - first.t
        if (dt > 0) v = ((last.x - first.x) / dt) * FRAME_MS
      }
      v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v))
      s.velocity = v
      s.lastTime = performance.now()
      s.rafId = requestAnimationFrame(loop)
    },
    [loop],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const s = stateRef.current
      if (!s.active || e.pointerId !== s.pointerId) return
      s.active = false
      const container = containerRef.current
      if (container?.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId)
      }
      // No momentum; just settle back if overscrolled.
      s.velocity = 0
      s.lastTime = performance.now()
      s.rafId = requestAnimationFrame(loop)
    },
    [loop],
  )

  // Measure on mount and whenever the container/content resizes.
  useEffect(() => {
    measure()
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(container)
    ro.observe(content)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => cancelRaf, [cancelRaf])

  return {
    containerRef,
    contentRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
