import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RiskGrid from './RiskGrid'

describe('RiskGrid', () => {
  it('renders three row headers numbered 1, 2, and 3', () => {
    render(<RiskGrid />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders cells for known risk codes', () => {
    render(<RiskGrid />)
    expect(screen.getByAltText('000000000000001')).toBeInTheDocument()
    expect(screen.getByAltText('000000010000000')).toBeInTheDocument()
  })

  it('calls onCellClick with the code when a cell is clicked', () => {
    const onCellClick = vi.fn()
    render(<RiskGrid onCellClick={onCellClick} />)
    fireEvent.click(screen.getByAltText('000000000000001'))
    expect(onCellClick).toHaveBeenCalledWith('000000000000001')
  })

  it('shows a lock icon for locked codes', () => {
    render(<RiskGrid lockedCodes={['000000000000001']} />)
    const cell = screen.getByAltText('000000000000001').closest('div.relative')
    expect(cell?.querySelector('svg.lucide-lock')).toBeInTheDocument()
  })

  it('renders selected cells for picked codes', () => {
    render(<RiskGrid picks={['000000000000001']} />)
    const cell = screen.getByAltText('000000000000001').closest('div.relative')
    expect(cell?.querySelector('.bg-cell-selected')).toBeInTheDocument()
  })

  it('still renders key/extra cells when useKey is false', () => {
    render(
      <RiskGrid
        useKey={false}
        keyExtraCodes={new Set(['000000010000000'])}
      />,
    )
    expect(screen.getByAltText('000000010000000')).toBeInTheDocument()
  })

  it('sets --cell-h with a clamp() on the grid root', () => {
    const { container } = render(<RiskGrid />)
    const root = container.firstChild as HTMLElement
    expect(root.style.getPropertyValue('--cell-h')).toBe('clamp(56px, 12svh, 136px)')
  })

  it('derives row dimensions from --cell-h via calc', () => {
    const { container } = render(<RiskGrid />)
    const row = container.querySelector('[class*="rounded-xl"]') as HTMLElement
    expect(row.style.height).toContain('calc(var(--cell-h)')
    expect(row.style.padding).toContain('calc(var(--cell-h)')
    expect(row.style.gap).toContain('calc(var(--cell-h)')
  })
})
