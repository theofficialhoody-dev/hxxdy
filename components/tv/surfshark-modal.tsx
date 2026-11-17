'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield } from 'lucide-react'

export function SurfsharkModal({ isOpen, onClose, onOpen }: {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}) {
  const [selected, setSelected] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (isOpen) setSelected(0)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) buttons.current[selected]?.focus({ preventScroll: true })
  }, [isOpen, selected])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      const { key, keyCode } = event
      if (['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key) || keyCode === 4 || keyCode === 27) {
        event.preventDefault()
        onClose()
      } else if (['ArrowLeft', 'ArrowUp'].includes(key) || [19, 21, 37, 38].includes(keyCode)) {
        event.preventDefault()
        setSelected(0)
      } else if (['ArrowRight', 'ArrowDown'].includes(key) || [20, 22, 39, 40].includes(keyCode)) {
        event.preventDefault()
        setSelected(1)
      } else if (['Enter', ' ', 'Select', 'Ok'].includes(key) || [13, 23, 66].includes(keyCode)) {
        event.preventDefault()
        if (!event.repeat) (selected === 0 ? onOpen : onClose)()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose, onOpen, selected])

  if (!isOpen) return null
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="surfshark-title"
      className="tv-menu-focus fixed inset-0 z-50 grid place-items-center bg-black/85 text-white">
      <div className="w-[min(90vw,540px)] rounded-3xl border border-white/20 bg-neutral-950 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <Shield className="size-8 text-[var(--tv-accent)]" />
          <h2 id="surfshark-title" className="text-xl font-bold">Surfshark VPN</h2>
        </div>
        <p className="mt-4 text-sm text-white/75">Connect or disconnect in Surfshark. This device does not provide a supported VPN toggle to other apps.</p>
        <div className="mt-6 flex gap-3">
          {['Open Surfshark', 'Close'].map((label, index) => (
            <button key={label} ref={(el) => { buttons.current[index] = el }} type="button"
              onMouseEnter={() => setSelected(index)} onClick={index === 0 ? onOpen : onClose}
              className="rounded-full bg-white/15 px-5 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--tv-accent)]">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
