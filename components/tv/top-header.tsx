'use client'

import { CircleUserRound, LayoutGrid, Palette, Settings, Shield, Wifi, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItemId } from '@/lib/launcher-data'
import type { ThemeConfig } from '@/lib/theme-data'
import { StatusClock } from './status-clock'

const icons: Record<NavItemId, LucideIcon> = {
  profile: CircleUserRound,
  theme: Palette,
  network: Wifi,
  settings: Settings,
  apps: LayoutGrid,
  surfshark: Shield,
}

const ariaLabels: Record<NavItemId, string> = {
  profile: 'Switch profile',
  theme: 'Change UI Theme',
  network: 'Network status: connected',
  settings: 'Settings',
  apps: 'Jump to My Apps',
  surfshark: 'Open Surfshark VPN',
}

type TopHeaderProps = {
  items: { id: NavItemId; label: string }[]
  focusedIndex: number
  registerRef: (index: number) => (el: HTMLElement | null) => void
  onHover: (index: number) => void
  onActivate: (index: number) => void
  activeThemeName?: string
  clock24h?: boolean
  showWeather?: boolean
  currentTheme?: ThemeConfig
}

export function TopHeader({
  items,
  focusedIndex,
  registerRef,
  onHover,
  onActivate,
  activeThemeName,
  clock24h,
  showWeather,
  currentTheme,
}: TopHeaderProps) {
  const accentColor = currentTheme?.accent || 'var(--tv-accent, #00f0ff)'
  const accentTextColor = currentTheme?.accentText || '#000000'
  const glowColor = currentTheme?.glow1 || 'var(--tv-glow, rgba(56,189,248,0.7))'
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end gap-[1.6vw] px-[5vw] pt-[4vh]">
      <StatusClock clock24h={clock24h} showWeather={showWeather} />
      <nav aria-label="System" className="pointer-events-auto">
        <ul className="flex items-center gap-[0.3vw] rounded-full bg-black/70 p-[0.35vw] shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/15 backdrop-blur-sm">
          {items.map((item, index) => {
            const Icon = icons[item.id]
            const focused = focusedIndex === index
            const labelText = item.id === 'theme' && activeThemeName ? `Theme · ${activeThemeName}` : item.label
            return (
              <li key={item.id} className="relative">
                <button
                  ref={registerRef(index)}
                  type="button"
                  aria-label={ariaLabels[item.id]}
                  onMouseEnter={() => onHover(index)}
                  onClick={() => onActivate(index)}
                  className={cn(
                    'relative grid size-[clamp(34px,2.6vw,56px)] place-items-center rounded-full text-white/85 outline-none',
                    'transition-[transform,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                    focused && 'scale-110 shadow-[0_6px_24px_rgba(0,0,0,0.5)]',
                    focused ? 'font-bold' : 'hover:bg-white/10',
                  )}
                  style={
                    focused
                      ? {
                          backgroundColor: accentColor,
                          color: accentTextColor,
                          boxShadow: `0 0 20px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5)`,
                        }
                      : undefined
                  }
                >
                  <Icon className="size-[46%]" strokeWidth={1.6} aria-hidden="true" />
                  {item.id === 'network' && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute right-[22%] top-[22%] size-[14%] rounded-full bg-emerald-400 ring-2',
                        focused ? 'ring-white' : 'ring-transparent',
                      )}
                    />
                  )}
                </button>
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute left-1/2 top-full mt-[1.2vh] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-[0.85em] py-[0.35em] text-[clamp(11px,0.8vw,16px)] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-sm',
                    'transition-[opacity,transform] duration-300',
                    focused ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
                  )}
                >
                  {labelText}
                </span>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
