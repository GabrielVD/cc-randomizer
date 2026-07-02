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
})
