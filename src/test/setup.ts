import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement ResizeObserver; provide a no-op stub so components
// using it (via useDragScroll) can mount.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// Auto-cleanup the DOM between tests (vitest runs without globals, so
// @testing-library/react's built-in auto-cleanup is not registered).
afterEach(() => {
  cleanup()
})
