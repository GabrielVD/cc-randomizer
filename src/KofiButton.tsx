import { useEffect, useRef } from 'react'

interface KofiWidget2 {
  init: (text: string, color: string, id: string) => void
  getHTML: () => string
  draw: () => void
}

declare global {
  interface Window {
    kofiwidget2?: KofiWidget2
  }
}

const WIDGET_URL = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js'
const WIDGET_SCRIPT_ID = 'kofi-widget-2-script'

function loadKofiWidgetScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(WIDGET_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Ko-fi widget')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = WIDGET_SCRIPT_ID
    script.src = WIDGET_URL
    script.async = true
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Ko-fi widget')), { once: true })
    document.head.appendChild(script)
  })
}

type KofiButtonProps = {
  text?: string
  color?: string
  kofiId: string
}

export default function KofiButton({
  text = 'Support me on Ko-fi',
  color = '#c0001c',
  kofiId,
}: KofiButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    loadKofiWidgetScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const widget = window.kofiwidget2
        if (!widget) return
        widget.init(text, color, kofiId)
        containerRef.current.innerHTML = widget.getHTML()
        // rel for opener security
        const anchor = containerRef.current.querySelector('a')
        if (anchor) anchor.rel = 'noopener noreferrer'
      })
      .catch(() => {
        // Network or load failure: button simply does not render
      })
    return () => {
      cancelled = true
    }
  }, [text, color, kofiId])

  return <div ref={containerRef} />
}
