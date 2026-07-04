import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import KofiButton from './KofiButton'

const WIDGET_URL = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js'
const WIDGET_SCRIPT_ID = 'kofi-widget-2-script'

function fireScriptLoad() {
  const script = document.querySelector(`script[src="${WIDGET_URL}"]`)
  if (script) fireEvent.load(script)
}

describe('KofiButton', () => {
  afterEach(() => {
    document.getElementById(WIDGET_SCRIPT_ID)?.remove()
    delete (window as Partial<Window>).kofiwidget2
  })

  it('renders an empty container before the widget script loads', () => {
    render(<KofiButton kofiId="J7O022LHVW" />)
    expect(document.querySelector('.kofi-button')).not.toBeInTheDocument()
  })

  it('injects the Ko-fi button after the script loads', async () => {
    const init = vi.fn()
    const getHTML = vi.fn(
      () =>
        '<style></style><div class="btn-container"><a class="kofi-button" href="https://ko-fi.com/J7O022LHVW" target="_blank"><span class="kofitext">Support me on Ko-fi</span></a></div>',
    )
    window.kofiwidget2 = { init, getHTML, draw: vi.fn() }

    render(<KofiButton kofiId="J7O022LHVW" />)
    fireScriptLoad()

    await waitFor(() => expect(init).toHaveBeenCalledWith('Support me on Ko-fi', '#c0001c', 'J7O022LHVW'))
    const button = document.querySelector('.kofi-button') as HTMLAnchorElement
    expect(button).not.toBeNull()
    expect(button).toHaveAttribute('href', 'https://ko-fi.com/J7O022LHVW')
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('passes custom text, color, and id to the widget', async () => {
    const init = vi.fn()
    const getHTML = vi.fn(() => '<a class="kofi-button" href="https://ko-fi.com/ABC">Buy me a coffee</a>')
    window.kofiwidget2 = { init, getHTML, draw: vi.fn() }

    render(<KofiButton kofiId="ABC" text="Buy me a coffee" color="#ff0000" />)
    fireScriptLoad()

    await waitFor(() => expect(init).toHaveBeenCalledWith('Buy me a coffee', '#ff0000', 'ABC'))
  })

  it('does not render a button when the script fails to load', () => {
    render(<KofiButton kofiId="J7O022LHVW" />)
    const script = document.querySelector(`script[src="${WIDGET_URL}"]`)!
    fireEvent.error(script)
    expect(document.querySelector('.kofi-button')).not.toBeInTheDocument()
  })
})
