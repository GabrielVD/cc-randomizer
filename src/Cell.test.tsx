import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Cell from './Cell'

describe('Cell', () => {
  it('renders without crashing when given no risk code', () => {
    const { container } = render(<Cell />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the risk image for a known code', () => {
    render(<Cell riskCode="000000000000001" />)
    expect(screen.getByAltText('000000000000001')).toBeInTheDocument()
  })

  it('calls onClick with the risk code when clicked', () => {
    const onClick = vi.fn()
    render(<Cell riskCode="000000000000001" onClick={onClick} />)
    fireEvent.click(screen.getByAltText('000000000000001'))
    expect(onClick).toHaveBeenCalledWith('000000000000001')
  })

  it('does not call onClick when the state is conflict', () => {
    const onClick = vi.fn()
    render(<Cell riskCode="000000000000001" state="conflict" onClick={onClick} />)
    fireEvent.click(screen.getByAltText('000000000000001'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows a lock icon when the state is locked', () => {
    const { container } = render(<Cell riskCode="000000000000001" state="locked" />)
    expect(container.querySelector('svg.lucide-lock')).toBeInTheDocument()
  })

  it('does not show a lock icon when the state is unselected', () => {
    const { container } = render(<Cell riskCode="000000000000001" state="unselected" />)
    expect(container.querySelector('svg.lucide-lock')).not.toBeInTheDocument()
  })

  it('renders a key icon for a key code', () => {
    const { container } = render(<Cell riskCode="000000010000000" />)
    // The key icon is an <img> with an empty alt inside the cell.
    const imgs = container.querySelectorAll('img[alt=""]')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('sizes the root from the --cell-h CSS variable', () => {
    const { container } = render(<Cell riskCode="000000000000001" />)
    const root = container.firstChild as HTMLElement
    expect(root.style.height).toBe('var(--cell-h)')
    expect(root.style.aspectRatio).toBe('7 / 9')
  })

  it('sizes the lock icon from --cell-h via calc', () => {
    const { container } = render(<Cell riskCode="000000000000001" state="locked" />)
    const lock = container.querySelector('svg.lucide-lock') as HTMLElement
    expect(lock.style.width).toContain('calc(var(--cell-h)')
    expect(lock.style.height).toContain('calc(var(--cell-h)')
  })

  it('renders an edge svg sized from --cell-h via calc', () => {
    // '000000000000002' has edge 'short'; for an unselected cell the edge svg
    // is the only svg without the lucide-lock class.
    const { container } = render(<Cell riskCode="000000000000002" />)
    const svg = container.querySelector('svg:not(.lucide-lock)') as SVGElement
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('viewBox')).not.toBeNull()
    expect(svg.style.height).toContain('calc(var(--cell-h)')
  })
})
