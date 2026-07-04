import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { encodeSettings } from './share'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.location.hash = ''
    document.getElementById('kofi-widget-2-script')?.remove()
  })

  it('renders the title and description', () => {
    render(<App />)
    expect(screen.getByText('CC Randomizer')).toBeInTheDocument()
    expect(
      screen.getByText(/Click on a cell to ban or lock it/),
    ).toBeInTheDocument()
  })

  it('renders a GitHub link pointing to the repository', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/GabrielVD/cc-randomizer',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('loads the Ko-fi widget script', () => {
    render(<App />)
    expect(
      document.querySelector(
        'script[src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"]',
      ),
    ).toBeInTheDocument()
  })

  it('renders three difficulty buttons with Normal selected by default', () => {
    render(<App />)
    const normal = screen.getByRole('button', { name: 'Normal' })
    expect(normal).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Easy' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Hard' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches difficulty on click', () => {
    render(<App />)
    const hard = screen.getByRole('button', { name: 'Hard' })
    fireEvent.click(hard)
    expect(hard).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('generates and displays a 15-character code when Randomize is clicked', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    const code = await screen.findByText(/^[0-9A-Z]{15}$/)
    expect(code).toBeInTheDocument()
  })

  it('toggles the key switch off and on', () => {
    render(<App />)
    const keySwitch = screen.getByRole('switch', { name: 'Key' })
    expect(keySwitch).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(keySwitch)
    expect(keySwitch).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(keySwitch)
    expect(keySwitch).toHaveAttribute('aria-checked', 'true')
  })

  it('clears selections when Reset is clicked', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    await screen.findByText(/^[0-9A-Z]{15}$/)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    // After reset the code paragraph holds a non-breaking space, not a code.
    expect(screen.queryByText(/^[0-9A-Z]{15}$/)).not.toBeInTheDocument()
  })

  it('applies settings from the URL hash on mount', () => {
    // hard, useKey=false, no locked/banned
    const hash =
      '#/s=' +
      encodeSettings({
        difficulty: 'hard',
        useKey: false,
        lockedCodes: [],
        bannedCodes: [],
      })
    window.location.hash = hash
    render(<App />)
    expect(screen.getByRole('button', { name: 'Hard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('switch', { name: 'Key' })).toHaveAttribute('aria-checked', 'false')
  })
})
