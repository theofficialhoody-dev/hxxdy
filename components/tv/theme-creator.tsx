'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dices,
  Eye,
  Layers,
  Palette,
  Pipette,
  Save,
  Sliders,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import type { ThemeConfig, ThemeGlowIntensity } from '@/lib/theme-data'
import { cn } from '@/lib/utils'

type ThemeCreatorProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: ThemeConfig) => void
  existingThemeCount: number
  currentTheme?: ThemeConfig
}

// Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Convert Hex to HSL for smooth editing
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '')
  const r = (parseInt(clean.substring(0, 2), 16) || 0) / 255
  const g = (parseInt(clean.substring(2, 4), 16) || 0) / 255
  const b = (parseInt(clean.substring(4, 6), 16) || 0) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = Math.round(h * 60)
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) || 0
  const g = parseInt(clean.substring(2, 4), 16) || 0
  const b = parseInt(clean.substring(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getContrastText(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) || 0
  const g = parseInt(clean.substring(2, 4), 16) || 0
  const b = parseInt(clean.substring(4, 6), 16) || 0
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 145 ? '#000000' : '#ffffff'
}

type ColorLayer = 'accent' | 'bg' | 'secondary'

// 30 Curated Milestone Colors covering all hues
const SPECTRUM_SWATCHES = [
  { hue: 0, hex: '#f43f5e', label: 'Crimson' },
  { hue: 15, hex: '#fb7185', label: 'Coral' },
  { hue: 28, hex: '#f97316', label: 'Tangerine' },
  { hue: 42, hex: '#fb923c', label: 'Amber' },
  { hue: 52, hex: '#f59e0b', label: 'Gold' },
  { hue: 68, hex: '#eab308', label: 'Solar' },
  { hue: 84, hex: '#84cc16', label: 'Lime' },
  { hue: 120, hex: '#22c55e', label: 'Spring' },
  { hue: 145, hex: '#10b981', label: 'Emerald' },
  { hue: 165, hex: '#14b8a6', label: 'Teal' },
  { hue: 180, hex: '#06b6d4', label: 'Cyan' },
  { hue: 195, hex: '#0ea5e9', label: 'Sky' },
  { hue: 215, hex: '#38bdf8', label: 'Ice Azure' },
  { hue: 228, hex: '#3b82f6', label: 'Cobalt' },
  { hue: 242, hex: '#6366f1', label: 'Indigo' },
  { hue: 260, hex: '#8b5cf6', label: 'Violet' },
  { hue: 278, hex: '#a855f7', label: 'Purple' },
  { hue: 295, hex: '#c084fc', label: 'Orchid' },
  { hue: 312, hex: '#d946ef', label: 'Magenta' },
  { hue: 330, hex: '#ec4899', label: 'Hot Pink' },
  { hue: -1, hex: '#ffffff', label: 'Pure White' },
  { hue: -2, hex: '#94a3b8', label: 'Titanium' },
  { hue: -3, hex: '#000000', label: 'OLED Black' },
]

const INTENSITY_OPTIONS: { id: ThemeGlowIntensity; label: string; desc: string; alpha: number }[] = [
  { id: 'subtle', label: 'Subtle (20%)', desc: 'Calm ambient focus', alpha: 0.18 },
  { id: 'vibrant', label: 'Cinematic (50%)', desc: 'Balanced theater radiance', alpha: 0.28 },
  { id: 'dramatic', label: 'High Voltage (85%)', desc: 'Futuristic synthwave aura', alpha: 0.42 },
]

const SUGGESTED_NAMES = [
  'Neon Odyssey',
  'Cyber Horizon',
  'Midnight Velvet',
  'Solaris Horizon',
  'Starlight Cinema',
  'Deep Abyss',
  'Vapor Twilight',
  'Emerald Matrix',
  'Cyber Noir',
  'Obsidian Pulse',
  'Golden Hour',
  'Titanium Studio',
  'Arcade Dream',
  'Crimson Dusk',
  'Quantum Violet',
  'Polar Mirage',
]

export function ThemeCreator({ isOpen, onClose, onSave, existingThemeCount, currentTheme }: ThemeCreatorProps) {
  // Active layer being customized
  const [activeLayer, setActiveLayer] = useState<ColorLayer>('accent')

  // Colors for each layer (complete user freedom to pick ANY color)
  const [accent, setAccent] = useState(currentTheme?.accent || '#06b6d4')
  const [bg, setBg] = useState(currentTheme?.bg || '#000000')
  const [secondaryGlow, setSecondaryGlow] = useState('#ec4899')

  // Current Hue & Tone for active layer
  const [currentHue, setCurrentHue] = useState(() => hexToHsl(currentTheme?.accent || '#06b6d4').h)
  const [accentTone, setAccentTone] = useState<'neon' | 'ice' | 'velvet' | 'pastel' | 'white'>('neon')
  const [bgDarkness, setBgDarkness] = useState<number>(0) // 0 = OLED, 3 = Abyss, 7 = Midnight, 12 = Cosmic, 16 = Smoked
  const [secondaryTone, setSecondaryTone] = useState<'neon' | 'ice' | 'velvet' | 'pastel' | 'white'>('neon')

  // General theme settings
  const [intensity, setIntensity] = useState<ThemeGlowIntensity>(currentTheme?.intensity || 'vibrant')
  const [nameIndex, setNameIndex] = useState(existingThemeCount % SUGGESTED_NAMES.length)

  // Reset to currentTheme values when modal opens
  useEffect(() => {
    if (isOpen && currentTheme) {
      setAccent(currentTheme.accent)
      setBg(currentTheme.bg)
      setIntensity(currentTheme.intensity)
      const hsl = hexToHsl(currentTheme.accent)
      setCurrentHue(hsl.h)
    }
  }, [isOpen, currentTheme])

  // Remote D-pad navigation
  // Row 0: Layer Selector (Accent / Base / Secondary / Auto-Harmonize)
  // Row 1: Rainbow Spectrum Track + Stepper
  // Row 2: Tone / Luminance Mode
  // Row 3: 30 Quick Spectrum Swatches
  // Row 4: Glow Intensity
  // Row 5: Theme Name Shuffle
  // Row 6: Save & Apply / Cancel
  const [activeRow, setActiveRow] = useState(0)
  const [colIndices, setColIndices] = useState<number[]>([0, 0, 0, 0, 1, 0, 0])

  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const swatchShelfRef = useRef<HTMLDivElement>(null)
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])

  const applyTone = (tone: 'neon' | 'ice' | 'velvet' | 'pastel' | 'white') => {
    if (activeLayer === 'accent') setAccentTone(tone)
    else setSecondaryTone(tone)
    const color = tone === 'white' ? '#ffffff' : hslToHex(
      currentHue,
      tone === 'neon' ? 100 : tone === 'ice' ? 95 : tone === 'velvet' ? 85 : 70,
      tone === 'neon' ? 50 : tone === 'ice' ? 70 : tone === 'velvet' ? 38 : 60,
    )
    if (activeLayer === 'accent') setAccent(color)
    else setSecondaryGlow(color)
  }

  // Synchronize hue when activeLayer changes
  useEffect(() => {
    const targetHex = activeLayer === 'accent' ? accent : activeLayer === 'bg' ? bg : secondaryGlow
    const hsl = hexToHsl(targetHex)
    setCurrentHue(hsl.h)
  }, [activeLayer])

  // Update color when hue or tone changes
  const applyHueChange = (newHue: number) => {
    setCurrentHue(newHue)
    if (activeLayer === 'accent') {
      if (newHue === -1) {
        setAccent('#ffffff')
      } else {
        const sat = accentTone === 'neon' ? 100 : accentTone === 'ice' ? 95 : accentTone === 'velvet' ? 85 : 70
        const light = accentTone === 'neon' ? 50 : accentTone === 'ice' ? 70 : accentTone === 'velvet' ? 38 : 60
        setAccent(hslToHex(newHue, sat, light))
      }
    } else if (activeLayer === 'bg') {
      if (bgDarkness === 0) {
        setBg('#000000')
      } else {
        // Deep atmospheric dark canvas with chosen hue
        setBg(hslToHex(newHue, 75, bgDarkness))
      }
    } else {
      const sat = secondaryTone === 'neon' ? 100 : secondaryTone === 'ice' ? 95 : secondaryTone === 'velvet' ? 85 : 70
      const light = secondaryTone === 'neon' ? 50 : secondaryTone === 'ice' ? 70 : secondaryTone === 'velvet' ? 38 : 60
      setSecondaryGlow(hslToHex(newHue, sat, light))
    }
  }

  // Update background darkness level
  const applyBgDarkness = (darkness: number) => {
    setBgDarkness(darkness)
    if (darkness === 0) {
      setBg('#000000')
    } else {
      setBg(hslToHex(currentHue, 75, darkness))
    }
  }

  // Auto-Harmonize magic function: computes cohesive base & secondary from current accent
  const handleAutoHarmonize = () => {
    const hsl = hexToHsl(accent)
    // Complementary hue for secondary aura
    const compHue = (hsl.h + 180) % 360
    const newSecondary = hslToHex(compHue, 100, 52)
    // Harmonious deep atmospheric background with subtle accent tint (5% lightness)
    const newBg = hslToHex((hsl.h + 20) % 360, 60, 4)

    setSecondaryGlow(newSecondary)
    setBg(newBg)
    setBgDarkness(4)
  }

  // Live TV background reflection
  useEffect(() => {
    if (!isOpen) return
    const root = document.querySelector('main')
    if (root) {
      const alpha = intensity === 'subtle' ? 0.18 : intensity === 'vibrant' ? 0.28 : 0.42
      root.style.setProperty('--tv-bg', bg)
      root.style.setProperty('--tv-accent', accent)
      root.style.setProperty('--tv-accent-text', getContrastText(accent))
      root.style.setProperty('--tv-glow', hexToRgba(accent, alpha))
      root.style.setProperty('--tv-glow-2', hexToRgba(secondaryGlow, alpha * 0.75))
      root.style.setProperty('--tv-glass', hexToRgba(accent, 0.12))
      root.style.setProperty('--tv-glass-border', hexToRgba(accent, 0.3))
    }
  }, [isOpen, bg, accent, secondaryGlow, intensity])

  // Smooth scroll active row into safe view
  useEffect(() => {
    if (!isOpen) return
    const targetRow = rowRefs.current[activeRow]
    if (targetRow && scrollContainerRef.current) {
      targetRow.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }
  }, [isOpen, activeRow])

  useEffect(() => {
    if (!isOpen || activeRow !== 3) return
    const shelf = swatchShelfRef.current
    const swatch = swatchRefs.current[colIndices[3]]
    if (!shelf || !swatch) return
    const left = swatch.offsetLeft
    if (left < shelf.scrollLeft) shelf.scrollLeft = left
    else if (left + swatch.offsetWidth > shelf.scrollLeft + shelf.clientWidth) {
      shelf.scrollLeft = left + swatch.offsetWidth - shelf.clientWidth
    }
  }, [isOpen, activeRow, colIndices])

  // Remote D-Pad Listener
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const code = e.keyCode

      const isBack =
        ['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key) ||
        code === 27 ||
        code === 8 ||
        code === 4
      const isSelect =
        ['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key) ||
        code === 13 ||
        code === 23 ||
        code === 66

      if (isBack) {
        e.preventDefault()
        onClose()
        return
      }

      // Vertical navigation
      if (key === 'ArrowUp' || code === 38 || code === 19) {
        e.preventDefault()
        setActiveRow((prev) => Math.max(0, prev - 1))
        return
      }

      if (key === 'ArrowDown' || code === 40 || code === 20) {
        e.preventDefault()
        setActiveRow((prev) => Math.min(6, prev + 1))
        return
      }

      // Horizontal navigation
      if (key === 'ArrowLeft' || code === 37 || code === 21) {
        e.preventDefault()
        if (activeRow === 0) {
          // Switch target layer
          const layers: ColorLayer[] = ['accent', 'bg', 'secondary']
          const nextIdx = Math.max(0, colIndices[0] - 1)
          setActiveLayer(layers[nextIdx])
          setColIndices((prev) => ({ ...prev, 0: nextIdx }))
        } else if (activeRow === 1) {
          // Step hue backward
          const nextHue = (currentHue - 15 + 360) % 360
          applyHueChange(nextHue)
        } else if (activeRow === 2) {
          if (activeLayer === 'bg') {
            const levels = [0, 3, 7, 12, 16]
            setColIndices((prev) => {
              const next = Math.max(0, prev[2] - 1)
              applyBgDarkness(levels[next])
              return { ...prev, 2: next }
            })
          } else {
            const tones = ['neon', 'ice', 'velvet', 'pastel', 'white'] as const
            setColIndices((prev) => {
              const next = Math.max(0, prev[2] - 1)
              applyTone(tones[next])
              return { ...prev, 2: next }
            })
          }
        } else if (activeRow === 3) {
          // Swatches
          setColIndices((prev) => {
            const next = Math.max(0, prev[3] - 1)
            const sw = SPECTRUM_SWATCHES[next]
            if (activeLayer === 'accent') setAccent(sw.hex)
            else if (activeLayer === 'bg') setBg(sw.hex)
            else setSecondaryGlow(sw.hex)
            if (sw.hue >= 0) setCurrentHue(sw.hue)
            return { ...prev, 3: next }
          })
        } else if (activeRow === 4) {
          setColIndices((prev) => {
            const next = Math.max(0, prev[4] - 1)
            setIntensity(INTENSITY_OPTIONS[next].id)
            return { ...prev, 4: next }
          })
        } else if (activeRow === 5) {
          setNameIndex((prev) => (prev - 1 + SUGGESTED_NAMES.length) % SUGGESTED_NAMES.length)
        } else if (activeRow === 6) {
          setColIndices((prev) => ({ ...prev, 6: 0 }))
        }
        return
      }

      if (key === 'ArrowRight' || code === 39 || code === 22) {
        e.preventDefault()
        if (activeRow === 0) {
          const layers: ColorLayer[] = ['accent', 'bg', 'secondary']
          const nextIdx = Math.min(layers.length, colIndices[0] + 1)
          if (nextIdx < layers.length) setActiveLayer(layers[nextIdx])
          setColIndices((prev) => ({ ...prev, 0: nextIdx }))
        } else if (activeRow === 1) {
          const nextHue = (currentHue + 15) % 360
          applyHueChange(nextHue)
        } else if (activeRow === 2) {
          if (activeLayer === 'bg') {
            const levels = [0, 3, 7, 12, 16]
            setColIndices((prev) => {
              const next = Math.min(levels.length - 1, prev[2] + 1)
              applyBgDarkness(levels[next])
              return { ...prev, 2: next }
            })
          } else {
            const tones = ['neon', 'ice', 'velvet', 'pastel', 'white'] as const
            setColIndices((prev) => {
              const next = Math.min(tones.length - 1, prev[2] + 1)
              applyTone(tones[next])
              return { ...prev, 2: next }
            })
          }
        } else if (activeRow === 3) {
          setColIndices((prev) => {
            const next = Math.min(SPECTRUM_SWATCHES.length - 1, prev[3] + 1)
            const sw = SPECTRUM_SWATCHES[next]
            if (activeLayer === 'accent') setAccent(sw.hex)
            else if (activeLayer === 'bg') setBg(sw.hex)
            else setSecondaryGlow(sw.hex)
            if (sw.hue >= 0) setCurrentHue(sw.hue)
            return { ...prev, 3: next }
          })
        } else if (activeRow === 4) {
          setColIndices((prev) => {
            const next = Math.min(INTENSITY_OPTIONS.length - 1, prev[4] + 1)
            setIntensity(INTENSITY_OPTIONS[next].id)
            return { ...prev, 4: next }
          })
        } else if (activeRow === 5) {
          setNameIndex((prev) => (prev + 1) % SUGGESTED_NAMES.length)
        } else if (activeRow === 6) {
          setColIndices((prev) => ({ ...prev, 6: 1 }))
        }
        return
      }

      // Enter / OK
      if (isSelect) {
        e.preventDefault()
        if (activeRow === 0 && colIndices[0] === 3) {
          handleAutoHarmonize()
        } else if (activeRow === 5) {
          setNameIndex((prev) => (prev + 1) % SUGGESTED_NAMES.length)
        } else if (activeRow === 6) {
          if (colIndices[6] === 1) {
            handleSave()
          } else {
            onClose()
          }
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeRow, colIndices, activeLayer, currentHue, accentTone, bgDarkness, secondaryTone, onClose])

  if (!isOpen) return null

  const handleSave = () => {
    const alpha = intensity === 'subtle' ? 0.18 : intensity === 'vibrant' ? 0.28 : 0.42
    const themeName = SUGGESTED_NAMES[nameIndex]

    const newTheme: ThemeConfig = {
      id: `custom-${Date.now()}`,
      name: themeName,
      description: 'Custom Studio Creation',
      bg,
      accent,
      accentText: getContrastText(accent),
      glow1: hexToRgba(accent, alpha),
      glow2: hexToRgba(secondaryGlow, alpha * 0.75),
      glassBg: hexToRgba(accent, 0.12),
      glassBorder: hexToRgba(accent, 0.3),
      intensity,
      isCustom: true,
    }

    onSave(newTheme)
  }

  // Active layer color
  const activeColorHex = activeLayer === 'accent' ? accent : activeLayer === 'bg' ? bg : secondaryGlow

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tv-creator-title"
      className="fixed inset-0 z-50 flex flex-col justify-between p-[3.5vw] backdrop-blur-2xl animate-in fade-in duration-200 text-white select-none overflow-hidden"
      style={{
        backgroundColor: bg || '#050508',
        background: `radial-gradient(ellipse 90% 60% at 50% -10%, ${hexToRgba(accent, 0.22)}, transparent 75%), ${bg || '#050508'}`,
      }}
    >
      {/* Top Header */}
      <div className="flex h-[8vh] max-h-[60px] items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-[1vw]">
          <span
            className="grid size-[clamp(36px,2.6vw,48px)] place-items-center rounded-2xl shadow-lg transition-all text-white"
            style={{
              backgroundColor: accent,
              boxShadow: `0 0 20px ${hexToRgba(accent, 0.5)}`,
            }}
          >
            <Palette className="size-5 text-white" />
          </span>
          <div>
            <h2 id="tv-creator-title" className="text-[clamp(18px,1.4vw,26px)] font-bold tracking-tight text-white">
              TV Theme Studio
            </h2>
            <p className="text-[clamp(11px,0.78vw,14px)] text-white/60">
              Complete color freedom: Customize Accent, Canvas Base, and Aura with real-time TV preview
            </p>
          </div>
        </div>

        {/* Global Color Overview Badges with Direct Native Eye-Dropper */}
        <div className="flex items-center gap-2.5">
          <label
            title="Custom Hex Picker"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-mono font-bold text-white border border-white/20 cursor-pointer hover:bg-white/20"
          >
            <span className="size-3.5 rounded-full" style={{ backgroundColor: activeColorHex }} />
            <span>{activeColorHex.toUpperCase()}</span>
            <input
              ref={colorInputRef}
              type="color"
              value={activeColorHex}
              onChange={(e) => {
                const hex = e.target.value
                if (activeLayer === 'accent') setAccent(hex)
                else if (activeLayer === 'bg') setBg(hex)
                else setSecondaryGlow(hex)
                const hsl = hexToHsl(hex)
                setCurrentHue(hsl.h)
              }}
              className="sr-only"
            />
            <Pipette className="size-3 text-white/60 ml-1" />
          </label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit theme studio"
            className="grid size-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Options Area: Smooth Auto-Scrolling */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-[2vh]"
      >
        {/* ROW 0: Target Color Layer Selector */}
        <div
          ref={(el) => {
            rowRefs.current[0] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border',
            activeRow === 0
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 0 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              1. Select Element to Color (Full Freedom For Any Option)
            </span>
            <button
              type="button"
              onClick={handleAutoHarmonize}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md text-white"
              style={{
                backgroundColor: accent,
                boxShadow: `0 0 ${activeRow === 0 && colIndices[0] === 3 ? 24 : 14}px ${hexToRgba(accent, activeRow === 0 && colIndices[0] === 3 ? 0.9 : 0.4)}`,
              }}
            >
              <Sparkles className="size-3.5" />
              <span>Auto-Harmonize Colors</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Layer 1: Primary Accent */}
            <button
              type="button"
              onClick={() => {
                setActiveRow(0)
                setActiveLayer('accent')
              }}
              className={cn(
                'flex items-center justify-between rounded-xl p-3 border transition-all text-left outline-none backdrop-blur-md',
                activeLayer === 'accent'
                  ? 'text-white scale-102 shadow-lg'
                  : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
              )}
              style={
                activeLayer === 'accent'
                  ? {
                      backgroundColor: hexToRgba(accent, 0.16),
                      borderColor: accent,
                      boxShadow: `0 0 20px ${hexToRgba(accent, 0.35)}`,
                    }
                  : undefined
              }
            >
              <div>
                <span className="text-xs font-bold block text-white">Primary Accent</span>
                <span className="text-[10px] block font-mono mt-0.5 text-white/60">
                  {accent.toUpperCase()}
                </span>
              </div>
              <span
                className="size-5 rounded-full shadow border border-white/40 shrink-0 ml-2"
                style={{ backgroundColor: accent, boxShadow: `0 0 10px ${hexToRgba(accent, 0.5)}` }}
              />
            </button>

            {/* Layer 2: Canvas Base Atmosphere */}
            <button
              type="button"
              onClick={() => {
                setActiveRow(0)
                setActiveLayer('bg')
              }}
              className={cn(
                'flex items-center justify-between rounded-xl p-3 border transition-all text-left outline-none backdrop-blur-md',
                activeLayer === 'bg'
                  ? 'text-white scale-102 shadow-lg'
                  : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
              )}
              style={
                activeLayer === 'bg'
                  ? {
                      backgroundColor: hexToRgba(accent, 0.16),
                      borderColor: accent,
                      boxShadow: `0 0 20px ${hexToRgba(accent, 0.35)}`,
                    }
                  : undefined
              }
            >
              <div>
                <span className="text-xs font-bold block text-white">Canvas Base Tone</span>
                <span className="text-[10px] block font-mono mt-0.5 text-white/60">
                  {bg.toUpperCase()}
                </span>
              </div>
              <span
                className="size-5 rounded-full shadow border border-white/40 shrink-0 ml-2"
                style={{ backgroundColor: bg }}
              />
            </button>

            {/* Layer 3: Secondary Glow Aura */}
            <button
              type="button"
              onClick={() => {
                setActiveRow(0)
                setActiveLayer('secondary')
              }}
              className={cn(
                'flex items-center justify-between rounded-xl p-3 border transition-all text-left outline-none backdrop-blur-md',
                activeLayer === 'secondary'
                  ? 'text-white scale-102 shadow-lg'
                  : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
              )}
              style={
                activeLayer === 'secondary'
                  ? {
                      backgroundColor: hexToRgba(accent, 0.16),
                      borderColor: accent,
                      boxShadow: `0 0 20px ${hexToRgba(accent, 0.35)}`,
                    }
                  : undefined
              }
            >
              <div>
                <span className="text-xs font-bold block text-white">Secondary Aura</span>
                <span className="text-[10px] block font-mono mt-0.5 text-white/60">
                  {secondaryGlow.toUpperCase()}
                </span>
              </div>
              <span
                className="size-5 rounded-full shadow border border-white/40 shrink-0 ml-2"
                style={{ backgroundColor: secondaryGlow, boxShadow: `0 0 10px ${hexToRgba(secondaryGlow, 0.5)}` }}
              />
            </button>
          </div>
        </div>

        {/* ROW 1: 360° Continuous Hue Spectrum Track */}
        <div
          ref={(el) => {
            rowRefs.current[1] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border',
            activeRow === 1
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 1 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              2. Adjust Hue Across 360° ({activeLayer === 'accent' ? 'Accent' : activeLayer === 'bg' ? 'Base' : 'Aura'})
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: accent }}>
              {currentHue}° Hue
            </span>
          </div>

          {/* Stepper + Rainbow Track */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => applyHueChange((currentHue - 10 + 360) % 360)}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-mono font-bold text-white/80 hover:bg-white/20 active:scale-95 transition-all"
            >
              -10°
            </button>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                applyHueChange(Math.round(ratio * 360))
              }}
              className="relative h-4 flex-1 rounded-full overflow-hidden shadow-inner ring-1 ring-white/30 cursor-pointer"
            >
              <div
                className="h-full w-full"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ff7700 8%, #ffdd00 16%, #88ff00 25%, #00ff66 33%, #00ffff 45%, #0088ff 58%, #7700ff 72%, #ff00ff 85%, #ff0077 94%, #ff0000 100%)',
                }}
              />
              {/* Position indicator */}
              <span
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md ring-1 ring-black/50"
                style={{ left: `${(currentHue / 360) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => applyHueChange((currentHue + 10) % 360)}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-mono font-bold text-white/80 hover:bg-white/20 active:scale-95 transition-all"
            >
              +10°
            </button>
          </div>
        </div>

        {/* ROW 2: Tone / Luminance / Darkness Mode for Active Layer */}
        <div
          ref={(el) => {
            rowRefs.current[2] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border',
            activeRow === 2
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 2 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              3. {activeLayer === 'bg' ? 'Canvas Base Darkness Level' : 'Color Tone & Radiance'}
            </span>
            <span className="text-xs text-white/50">
              {activeLayer === 'bg' ? 'Choose depth from pure black to rich dark tint' : 'Saturation & Luminance preset'}
            </span>
          </div>

          {activeLayer === 'bg' ? (
            /* Canvas Base Darkness levels */
            <div className="grid grid-cols-5 gap-2">
              {[
                { level: 0, label: 'Pure OLED', desc: 'Pitch 0% darkness' },
                { level: 3, label: 'Abyss 3%', desc: 'Ultra deep shadow' },
                { level: 7, label: 'Midnight 7%', desc: 'Rich atmospheric tint' },
                { level: 12, label: 'Cosmic 12%', desc: 'Visible color void' },
                { level: 16, label: 'Smoked 16%', desc: 'Lighter charcoal hue' },
              ].map((b) => (
                <button
                  key={b.level}
                  type="button"
                  onClick={() => applyBgDarkness(b.level)}
                  className={cn(
                    'rounded-xl p-2.5 text-left border transition-all outline-none backdrop-blur-md',
                    bgDarkness === b.level
                      ? 'text-white shadow-md scale-102'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
                  )}
                  style={
                    bgDarkness === b.level
                      ? {
                          backgroundColor: hexToRgba(accent, 0.18),
                          borderColor: accent,
                          boxShadow: `0 0 16px ${hexToRgba(accent, 0.3)}`,
                        }
                      : undefined
                  }
                >
                  <span className="text-xs font-bold block truncate text-white">{b.label}</span>
                  <span className="text-[10px] block truncate text-white/60">
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Accent & Secondary Tones */
            <div className="grid grid-cols-5 gap-2">
              {([
                { id: 'neon', label: 'Electric Neon', desc: '100% Saturation' },
                { id: 'ice', label: 'Ice Brilliance', desc: 'Bright Radiant' },
                { id: 'velvet', label: 'Deep Velvet', desc: 'Rich Jewel Tone' },
                { id: 'pastel', label: 'Soft Pastel', desc: 'Calm Aesthetic' },
                { id: 'white', label: 'Pure White', desc: 'Monochrome Silver' },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    applyTone(t.id)
                  }}
                  className={cn(
                    'rounded-xl p-2.5 text-left border transition-all outline-none backdrop-blur-md',
                    (activeLayer === 'accent' ? accentTone : secondaryTone) === t.id
                      ? 'text-white shadow-md scale-102'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
                  )}
                  style={
                    (activeLayer === 'accent' ? accentTone : secondaryTone) === t.id
                      ? {
                          backgroundColor: hexToRgba(accent, 0.18),
                          borderColor: accent,
                          boxShadow: `0 0 16px ${hexToRgba(accent, 0.3)}`,
                        }
                      : undefined
                  }
                >
                  <span className="text-xs font-bold block truncate text-white">{t.label}</span>
                  <span className="text-[10px] block truncate text-white/60">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ROW 3: Universal 30 Quick Spectrum Swatches */}
        <div
          ref={(el) => {
            rowRefs.current[3] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border',
            activeRow === 3
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 3 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              4. Quick Palette Swatches (Apply to {activeLayer === 'accent' ? 'Accent' : activeLayer === 'bg' ? 'Base' : 'Aura'})
            </span>
            <span className="text-xs text-white/50">Direct 1-click jump</span>
          </div>

          <div ref={swatchShelfRef} className="relative flex gap-2 overflow-x-auto no-scrollbar py-1">
            {SPECTRUM_SWATCHES.map((sw, idx) => {
              const isSelected = colIndices[3] === idx && activeRow === 3
              const isActive = activeColorHex.toLowerCase() === sw.hex.toLowerCase()

              return (
                <button
                  key={sw.label}
                  ref={(el) => { swatchRefs.current[idx] = el }}
                  type="button"
                  onClick={() => {
                    if (activeLayer === 'accent') setAccent(sw.hex)
                    else if (activeLayer === 'bg') setBg(sw.hex)
                    else setSecondaryGlow(sw.hex)
                    if (sw.hue >= 0) setCurrentHue(sw.hue)
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 outline-none backdrop-blur-md border',
                    isSelected
                      ? 'scale-108 text-white shadow-lg'
                      : isActive
                        ? 'text-white'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/15 border-white/10',
                  )}
                  style={
                    isSelected || isActive
                      ? {
                          backgroundColor: hexToRgba(sw.hex === '#000000' ? accent : sw.hex, 0.22),
                          borderColor: sw.hex === '#000000' ? accent : sw.hex,
                          boxShadow: `0 0 14px ${hexToRgba(sw.hex === '#000000' ? accent : sw.hex, 0.4)}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-3.5 rounded-full border border-black/30 shadow-sm"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span>{sw.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ROW 4: Ambient Glow Energy */}
        <div
          ref={(el) => {
            rowRefs.current[4] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border',
            activeRow === 4
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 4 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              5. Ambient Glow Energy
            </span>
            <span className="text-xs text-white/50">Backdrop bloom & lighting radius</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITY_OPTIONS.map((opt) => {
              const isActive = intensity === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntensity(opt.id)}
                  className={cn(
                    'rounded-xl p-2.5 text-center border transition-all outline-none backdrop-blur-md',
                    isActive
                      ? 'text-white shadow-md scale-102 font-bold'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]',
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: hexToRgba(accent, 0.28),
                          borderColor: accent,
                          boxShadow: `0 0 16px ${hexToRgba(accent, 0.4)}`,
                        }
                      : undefined
                  }
                >
                  <span className="text-xs font-bold block text-white">{opt.label}</span>
                  <span className="text-[10px] block text-white/60">
                    {opt.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ROW 5: Theme Name Generator */}
        <div
          ref={(el) => {
            rowRefs.current[5] = el
          }}
          className={cn(
            'rounded-2xl p-4 transition-all duration-200 border flex items-center justify-between',
            activeRow === 5
              ? 'bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.02]',
          )}
          style={{
            borderColor: activeRow === 5 ? hexToRgba(accent, 0.4) : 'rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white/80 block">
              6. Theme Name
            </span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {SUGGESTED_NAMES[nameIndex]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setNameIndex((prev) => (prev + 1) % SUGGESTED_NAMES.length)}
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 active:scale-95"
          >
            <Dices className="size-4" />
            <span>Shuffle Name</span>
          </button>
        </div>
      </div>

      {/* ROW 6: Fixed Action Footer (Never Cut Off on TV) */}
      <div
        ref={(el) => {
          rowRefs.current[6] = el
        }}
        className="flex h-[8vh] max-h-[60px] items-center justify-between pt-2 border-t border-white/10 shrink-0"
      >
        <span className="text-[clamp(10px,0.7vw,13px)] text-white/40">
          ▲ / ▼ Option · ◄ / ► Tune Color · [OK] Select · [Back] Exit
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-full px-5 py-2 text-xs font-semibold transition-all outline-none backdrop-blur-md',
              activeRow === 6 && colIndices[6] === 0
                ? 'bg-white/25 text-white shadow-lg scale-105 font-bold'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all outline-none shadow-lg',
              activeRow === 6 && colIndices[6] === 1 ? 'scale-105' : 'hover:scale-102',
            )}
            style={{
              backgroundColor: accent,
              color: getContrastText(accent),
              boxShadow: `0 0 ${activeRow === 6 && colIndices[6] === 1 ? 28 : 20}px ${hexToRgba(accent, activeRow === 6 && colIndices[6] === 1 ? 0.9 : 0.45)}`,
            }}
          >
            <Check className="size-4 stroke-[3]" />
            <span className="font-bold tracking-wide">Save & Apply Theme</span>
          </button>
        </div>
      </div>
    </div>
  )
}
