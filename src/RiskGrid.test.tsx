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
})
