'use client'

import { CircleUserRound, LayoutGrid, Palette, Settings, Shield, Wifi, WifiOff, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItemId } from '@/lib/launcher-data'
import type { Profile } from '@/lib/profiles'
import { StatusClock } from './status-clock'

const icons: Record<NavItemId, LucideIcon> = {
  profile: CircleUserRound,
  theme: Palette,
  network: Wifi,
  settings: Settings,
  apps: LayoutGrid,
  surfshark: Shield,
}

type TopHeaderProps = {
  items: { id: NavItemId; label: string }[]
  focusedIndex: number
  registerRef: (index: number) => (el: HTMLElement | null) => void
  onHover: (index: number) => void
  onActivate: (index: number) => void
  activeThemeName?: string
  activeProfile?: Profile
  networkConnected?: boolean
  clock24h?: boolean
  showWeather?: boolean
}

export function TopHeader({
  items,
  focusedIndex,
  registerRef,
  onHover,
  onActivate,
  activeThemeName,
  activeProfile,
  networkConnected = true,
  clock24h,
  showWeather,
}: TopHeaderProps) {
  const accentColor = 'var(--tv-accent, #38bdf8)'
  const accentTextColor = 'var(--tv-accent-text, #000000)'

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end gap-[1.5vw] px-[5vw] pt-[3.4vh]">
      <StatusClock clock24h={clock24h} showWeather={showWeather} />
      <nav aria-label="System" className="pointer-events-auto">
        <ul
          className="flex items-center gap-[0.34vw] rounded-full p-[clamp(4px,0.34vw,6px)]"
          style={{
            backgroundColor: 'var(--tv-surface, rgba(10,11,16,0.86))',
            boxShadow: 'inset 0 0 0 1px var(--tv-glass-border, rgba(255,255,255,0.14)), 0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {items.map((item, index) => {
            const Icon = item.id === 'network' && !networkConnected ? WifiOff : icons[item.id]
            const focused = focusedIndex === index
            const isLast = index === items.length - 1
            const labelText =
              item.id === 'profile' && activeProfile
                ? activeProfile.name
                : item.id === 'theme' && activeThemeName
                  ? `Theme · ${activeThemeName}`
                  : item.id === 'network' && !networkConnected
                    ? 'Offline · Network'
                    : item.label

            const ariaLabel =
              item.id === 'profile'
                ? `Switch profile (${activeProfile?.name ?? 'Default'})`
                : item.id === 'theme'
                  ? 'Change UI Theme'
                  : item.id === 'network'
                    ? networkConnected
                      ? 'Network status: connected'
                      : 'Network status: disconnected'
                    : item.id === 'settings'
                      ? 'Settings'
                      : item.id === 'apps'
                        ? 'Jump to My Apps'
                        : 'Open Surfshark VPN'

            return (
              <li key={item.id} className="relative">
                <button
                  ref={registerRef(index)}
                  type="button"
                  aria-label={ariaLabel}
                  onMouseEnter={() => onHover(index)}
                  onClick={() => onActivate(index)}
                  className={cn(
                    'relative grid size-[clamp(38px,2.85vw,56px)] place-items-center rounded-full text-white/85 outline-none focus:outline-none focus-visible:outline-none',
                    'transition-[transform,background-color,color,box-shadow] duration-200 ease-out',
                    focused ? 'scale-105' : 'hover:bg-white/10 hover:text-white',
                  )}
                  style={
                    focused
                      ? {
                          backgroundColor: accentColor,
                          color: accentTextColor,
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28), 0 0 18px var(--tv-glow, rgba(56,189,248,0.35))',
                        }
                      : undefined
                  }
                >
                  {item.id === 'profile' && activeProfile ? (
                    <span
                      className="grid size-[64%] place-items-center rounded-full text-[clamp(12px,0.92vw,18px)] font-bold leading-none text-black"
                      style={{ backgroundColor: activeProfile.color }}
                      aria-hidden="true"
                    >
                      {activeProfile.name.slice(0, 1).toUpperCase()}
                    </span>
                  ) : (
                    <Icon
                      className={cn(
                        'size-[47%]',
                        item.id === 'network' && !networkConnected && !focused && 'text-rose-400',
                      )}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  )}
                </button>
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute top-full mt-[1.2vh] whitespace-nowrap rounded-full px-[0.95em] py-[0.38em] text-[clamp(12px,0.84vw,16px)] font-medium text-white',
                    isLast ? 'right-0' : 'left-1/2 -translate-x-1/2',
                    'transition-[opacity,transform] duration-200',
                    focused ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
                  )}
                  style={{
                    backgroundColor: 'var(--tv-surface, rgba(10,11,16,0.92))',
                    boxShadow:
                      'inset 0 0 0 1px var(--tv-glass-border, rgba(255,255,255,0.16)), 0 8px 24px rgba(0,0,0,0.65), 0 0 16px var(--tv-glow, rgba(56,189,248,0.24))',
                  }}
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
