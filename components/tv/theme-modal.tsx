'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type { ThemeConfig } from '@/lib/theme-data'
import { cn } from '@/lib/utils'

type ThemeModalProps = {
  isOpen: boolean
  onClose: () => void
  currentThemeId: string
  allThemes: ThemeConfig[]
  onSelectTheme: (theme: ThemeConfig) => void
  onOpenCreateModal: () => void
  onDeleteCustomTheme: (id: string) => void
  currentTheme?: ThemeConfig
}

type ModalZone = 'toolbar' | 'shelf'

export function ThemeModal({
  isOpen,
  onClose,
  currentThemeId,
  allThemes,
  onSelectTheme,
  onOpenCreateModal,
  onDeleteCustomTheme,
}: ThemeModalProps) {
  const [zone, setZone] = useState<ModalZone>('shelf')
  const [shelfIndex, setShelfIndex] = useState(0)
  const [toolbarIndex, setToolbarIndex] = useState(0)

  const shelfRef = useRef<HTMLUListElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const toolbarRefs = useRef<(HTMLButtonElement | null)[]>([])
  const pointerReady = useRef(true)

  useEffect(() => {
    if (!isOpen) return
    const onKey = () => { pointerReady.current = false }
    const onMove = (event: MouseEvent) => {
      if (event.movementX || event.movementY) pointerReady.current = true
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousemove', onMove)
    }
  }, [isOpen])

  // On open, focus current theme
  useEffect(() => {
    if (isOpen) {
      const idx = allThemes.findIndex((t) => t.id === currentThemeId)
      const targetIdx = idx >= 0 ? idx : 0
      setShelfIndex(targetIdx)
      setZone('shelf')
    }
    // Only reset when the modal opens; selecting a theme must not steal focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Scroll focused card into view smoothly
  useEffect(() => {
    if (!isOpen) return

    if (zone === 'shelf') {
      const el = cardRefs.current[shelfIndex]
      el?.focus({ preventScroll: true })
      const shelf = shelfRef.current
      if (shelf && el) {
        const item = (el.parentElement ?? el) as HTMLElement
        const padding = window.innerWidth * 0.05
        const itemStart = item.offsetLeft || 0
        shelf.scrollTo({ left: Math.max(0, itemStart - padding), behavior: 'auto' })
      }
    } else {
      toolbarRefs.current[toolbarIndex]?.focus({ preventScroll: true })
    }
  }, [isOpen, zone, shelfIndex, toolbarIndex])

  // Live preview current focused theme on the TV
  useEffect(() => {
    if (!isOpen || zone !== 'shelf') return
    const previewTheme = allThemes[shelfIndex]
    if (previewTheme) {
      const root = document.querySelector('main')
      if (root) {
        root.style.setProperty('--tv-bg', previewTheme.bg)
        root.style.setProperty('--tv-accent', previewTheme.accent)
        root.style.setProperty('--tv-accent-text', previewTheme.accentText)
        root.style.setProperty('--tv-glow', previewTheme.glow1)
        root.style.setProperty('--tv-glow-2', previewTheme.glow2)
        root.style.setProperty('--tv-glass', previewTheme.glassBg)
        root.style.setProperty('--tv-glass-border', previewTheme.glassBorder)
      }
    }
  }, [isOpen, zone, shelfIndex, allThemes])

  // D-Pad / Remote control listener (supporting Android TV & Google TV remote keycodes)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const code = e.keyCode

      const isBack = ['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key) || code === 27 || code === 8 || code === 4
      const isSelect = ['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key) || code === 13 || code === 23 || code === 66

      if ((key === 'ContextMenu' || key === 'Delete') && zone === 'shelf') {
        const selected = allThemes[shelfIndex]
        if (selected?.isCustom) {
          e.preventDefault()
          if (confirm(`Delete custom theme "${selected.name}"?`)) {
            onDeleteCustomTheme(selected.id)
            setShelfIndex(Math.max(0, shelfIndex - 1))
          }
        }
        return
      }

      if (isBack) {
        e.preventDefault()
        // Revert back to active theme before closing
        const activeTheme = allThemes.find((t) => t.id === currentThemeId) || allThemes[0]
        onSelectTheme(activeTheme)
        onClose()
        return
      }

      if (key === 'ArrowUp' || code === 38 || code === 19) {
        e.preventDefault()
        if (zone === 'shelf') {
          setZone('toolbar')
        }
        return
      }

      if (key === 'ArrowDown' || code === 40 || code === 20) {
        e.preventDefault()
        if (zone === 'toolbar') {
          setZone('shelf')
        }
        return
      }

      if (key === 'ArrowLeft' || code === 37 || code === 21) {
        e.preventDefault()
        if (zone === 'shelf') {
          setShelfIndex((prev) => Math.max(0, prev - 1))
        } else {
          setToolbarIndex((prev) => Math.max(0, prev - 1))
        }
        return
      }

      if (key === 'ArrowRight' || code === 39 || code === 22) {
        e.preventDefault()
        if (zone === 'shelf') {
          setShelfIndex((prev) => Math.min(allThemes.length - 1, prev + 1))
        } else {
          setToolbarIndex((prev) => Math.min(2, prev + 1))
        }
        return
      }

      if (isSelect) {
        e.preventDefault()
        if (zone === 'shelf') {
          const selected = allThemes[shelfIndex]
          if (selected) {
            onSelectTheme(selected)
          }
        } else {
          if (toolbarIndex === 0) onOpenCreateModal()
          else if (toolbarIndex === 1) {
            const defaultTheme = allThemes[0]
            if (defaultTheme) onSelectTheme(defaultTheme)
          } else {
            onClose()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, zone, shelfIndex, toolbarIndex, allThemes, currentThemeId, onSelectTheme, onOpenCreateModal, onDeleteCustomTheme, onClose])

  if (!isOpen) return null

  const activeThemeObj = allThemes.find((t) => t.id === currentThemeId) || allThemes[0]
  const focusedTheme = allThemes[shelfIndex] || activeThemeObj

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-browser-title"
      className="tv-menu-focus fixed inset-0 z-50 flex flex-col justify-between bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden text-white will-change-[opacity]"
      style={{
        background: `radial-gradient(circle at 50% 60%, ${focusedTheme.glow1}, transparent 70%), rgba(0, 0, 0, 0.82)`,
      }}
    >
      {/* Top TV Navigation Bar */}
      <div className="flex items-center justify-between px-[5vw] pt-[4vh] pb-[2vh]">
        <div className="flex items-center gap-[1.2vw]">
          <span
            className="grid size-[clamp(44px,3.2vw,64px)] place-items-center rounded-2xl shadow-xl transition-colors duration-500"
            style={{
              backgroundColor: focusedTheme.accent,
              color: focusedTheme.accentText,
              boxShadow: `0 8px 30px ${focusedTheme.glow1}`,
            }}
          >
            <Palette className="size-[55%]" strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h2 id="theme-browser-title" className="text-[clamp(20px,1.7vw,36px)] font-bold tracking-tight text-white drop-shadow">
                TV Themes
              </h2>
              <span className="rounded-full bg-white/15 px-[0.7em] py-[0.15em] text-[clamp(11px,0.85vw,16px)] font-semibold text-white/80 backdrop-blur-md">
                {allThemes.length} Available
              </span>
            </div>
            <p className="text-[clamp(12px,0.95vw,18px)] text-white/70">
              Atmospheric palettes with real-time screen preview
            </p>
          </div>
        </div>

        {/* TV Top Toolbar Actions */}
        <div className="flex items-center gap-[0.8vw]">
          <button
            ref={(el) => {
              toolbarRefs.current[0] = el
            }}
            type="button"
            onClick={onOpenCreateModal}
            onMouseEnter={() => {
              if (!pointerReady.current) return
              setZone('toolbar')
              setToolbarIndex(0)
            }}
            className={cn(
              'flex h-[clamp(40px,2.8vw,56px)] items-center gap-[0.6em] rounded-full px-[1.4em] text-[clamp(13px,0.95vw,18px)] font-bold outline-none transition-all duration-300 backdrop-blur-md shadow-lg',
              zone === 'toolbar' && toolbarIndex === 0
                ? 'scale-105'
                : 'hover:scale-102',
            )}
            style={{
              backgroundColor: activeThemeObj.accent,
              color: activeThemeObj.accentText,
              boxShadow: `0 4px 20px ${activeThemeObj.glow1}`,
            }}
          >
            <Plus className="size-[1.1em] stroke-[2.5]" />
            <span className="font-bold tracking-wide">Create Theme</span>
          </button>

          {/* Action 2: Reset to Default */}
          <button
            ref={(el) => {
              toolbarRefs.current[1] = el
            }}
            type="button"
            onClick={() => onSelectTheme(allThemes[0])}
            onMouseEnter={() => {
              if (!pointerReady.current) return
              setZone('toolbar')
              setToolbarIndex(1)
            }}
            className={cn(
              'flex h-[clamp(40px,2.8vw,56px)] items-center gap-[0.5em] rounded-full px-[1.2em] text-[clamp(13px,0.95vw,18px)] font-medium outline-none transition-all duration-300 backdrop-blur-md',
              zone === 'toolbar' && toolbarIndex === 1
                ? 'scale-105 bg-white/25 text-white shadow-xl font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white',
            )}
          >
            <RotateCcw className="size-[1.1em]" />
            <span>Reset</span>
          </button>

          {/* Action 3: Exit / Close */}
          <button
            ref={(el) => {
              toolbarRefs.current[2] = el
            }}
            type="button"
            onClick={onClose}
            aria-label="Exit theme browser"
            onMouseEnter={() => {
              if (!pointerReady.current) return
              setZone('toolbar')
              setToolbarIndex(2)
            }}
            className={cn(
              'grid size-[clamp(40px,2.8vw,56px)] place-items-center rounded-full outline-none transition-all duration-300 backdrop-blur-md',
              zone === 'toolbar' && toolbarIndex === 2
                ? 'scale-105 bg-white/25 text-white shadow-xl'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white',
            )}
          >
            <X className="size-[1.2em]" />
          </button>
        </div>
      </div>

      {/* Main TV Horizontal Shelf */}
      <div className="relative my-auto flex flex-col justify-center">
        {/* Active Theme Highlight Banner */}
        <div className="px-[5vw] mb-[2vh] flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[clamp(13px,1vw,20px)] font-medium text-white/60 uppercase tracking-widest">
              Previewing:
            </span>
            <span className="text-[clamp(18px,1.4vw,28px)] font-bold text-white drop-shadow">
              {focusedTheme.name}
            </span>
            {focusedTheme.isCustom && (
              <span className="rounded bg-white/20 px-2 py-0.5 text-[clamp(10px,0.75vw,14px)] font-bold uppercase tracking-wider text-white">
                Custom
              </span>
            )}
            {focusedTheme.id === currentThemeId && (
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[clamp(10px,0.75vw,14px)] font-bold shadow-md"
                style={{
                  backgroundColor: focusedTheme.accent,
                  color: focusedTheme.accentText,
                }}
              >
                <Check className="size-[1.1em] stroke-[3]" />
                Current Theme
              </span>
            )}
          </div>

          <p className="text-[clamp(13px,1vw,18px)] text-white/70 max-w-xl text-right truncate">
            {focusedTheme.description}
          </p>
        </div>

        {/* Cinematic Horizontal Shelf */}
        <ul
          ref={shelfRef}
          className="no-scrollbar relative flex gap-[2vw] overflow-x-auto px-[5vw] py-[3vh] scroll-smooth"
        >
          {allThemes.map((theme, index) => {
            const isFocused = zone === 'shelf' && index === shelfIndex
            const isCurrent = theme.id === currentThemeId

            return (
              <li key={theme.id} className="shrink-0">
                <button
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  type="button"
                  onClick={() => onSelectTheme(theme)}
                  onMouseEnter={() => {
                    if (!pointerReady.current) return
                    setZone('shelf')
                    setShelfIndex(index)
                  }}
                  className={cn(
                    'group relative flex w-[clamp(260px,22vw,440px)] flex-col overflow-hidden rounded-[clamp(18px,1.4vw,32px)] border text-left outline-none',
                    'transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform',
                    isFocused
                      ? 'scale-108 z-20 shadow-[0_30px_70px_rgba(0,0,0,0.85)]'
                      : 'opacity-85 hover:opacity-100 scale-100',
                  )}
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: isFocused
                      ? theme.accent
                      : isCurrent
                        ? 'rgba(255, 255, 255, 0.4)'
                        : 'rgba(255, 255, 255, 0.14)',
                    boxShadow: isFocused ? `0 24px 60px ${theme.glow1}` : undefined,
                  }}
                >
                  {/* Aspect Ratio Preview Canvas */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden p-[1.4vw] flex flex-col justify-between">
                    {/* Simulated Ambient Glow Aura */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background: `
                          radial-gradient(ellipse 90% 70% at 75% 20%, ${theme.glow1}, transparent 65%),
                          radial-gradient(ellipse 70% 50% at 20% 80%, ${theme.glow2}, transparent 70%)
                        `,
                      }}
                    />

                    {/* Top Row: Mini TV Badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-[0.5vw]">
                        <span
                          className="size-[clamp(12px,0.9vw,18px)] rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: theme.bg }}
                          title="Base"
                        />
                        <span
                          className="size-[clamp(12px,0.9vw,18px)] rounded-full shadow-md"
                          style={{ backgroundColor: theme.accent }}
                          title="Accent"
                        />
                        <div
                          className="h-[clamp(8px,0.6vw,12px)] w-[clamp(32px,2.2vw,48px)] rounded-full border border-white/20"
                          style={{
                            background: `linear-gradient(90deg, ${theme.glow1}, ${theme.glow2})`,
                          }}
                          title="Ambient Aura"
                        />
                      </div>

                      {isCurrent && (
                        <span
                          className="flex items-center gap-1 rounded-full px-[0.7em] py-[0.2em] text-[clamp(10px,0.7vw,13px)] font-bold shadow-md"
                          style={{
                            backgroundColor: theme.accent,
                            color: theme.accentText,
                          }}
                        >
                          <Check className="size-[1.1em] stroke-[3]" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Bottom Row inside card preview: Mini TV Controls */}
                    <div className="relative z-10 flex items-end justify-between pt-2">
                      <div className="space-y-1">
                        <span className="text-[clamp(16px,1.2vw,24px)] font-bold text-white tracking-tight drop-shadow leading-tight block">
                          {theme.name}
                        </span>
                        <span className="text-[clamp(11px,0.8vw,15px)] text-white/70 line-clamp-1 block">
                          {theme.description}
                        </span>
                      </div>

                      {/* Mini Action Button */}
                      <span
                        className="rounded-full px-[1em] py-[0.35em] text-[clamp(11px,0.8vw,15px)] font-semibold shadow-md shrink-0 transition-transform"
                        style={{
                          backgroundColor: isFocused ? theme.accent : 'rgba(255,255,255,0.18)',
                          color: isFocused ? theme.accentText : '#ffffff',
                        }}
                      >
                        {isCurrent ? 'Current' : 'Select'}
                      </span>
                    </div>
                  </div>

                </button>
                {theme.isCustom && (
                  <div className="flex items-center justify-between rounded-b-xl bg-black/40 px-[1.2vw] py-[0.8vh]">
                    <span className="text-[clamp(10px,0.7vw,13px)] text-white/50">Custom theme · Menu to delete</span>
                    <button type="button" onClick={() => {
                      if (confirm(`Delete custom theme "${theme.name}"?`)) onDeleteCustomTheme(theme.id)
                    }} aria-label={`Delete custom theme ${theme.name}`}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[clamp(10px,0.75vw,14px)] font-medium text-rose-400 hover:text-rose-300">
                      <Trash2 className="size-[1.1em]" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
