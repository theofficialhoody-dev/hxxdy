'use client'

import type { Ref } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LayoutGrid,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { services, type ServiceId } from '@/lib/launcher-data'
import type { ThemeConfig } from '@/lib/theme-data'
import { ServiceLogo } from './service-logo'

type AppsRowProps = {
  apps: ServiceId[]
  organize: boolean
  movingApp: boolean
  onSetOrganize: (on: boolean) => void
  hiddenCount: number
  focusedIndex: number
  focusedControl: number
  registerControlRef: (index: number) => (el: HTMLElement | null) => void
  onControlHover: (index: number) => void
  sectionRef: Ref<HTMLElement>
  shelfRef: Ref<HTMLUListElement>
  registerRef: (index: number) => (el: HTMLElement | null) => void
  onHover: (index: number) => void
  onActivate: (index: number) => void
  onMoveApp: (fromIndex: number, toIndex: number) => void
  onResetApps: () => void
  onOpenAppsMenu?: () => void
  onEditRow: () => void
  currentTheme?: ThemeConfig
}

export function AppsRow({
  apps,
  organize: isOrganizeMode,
  movingApp,
  onSetOrganize,
  hiddenCount,
  focusedIndex,
  focusedControl,
  registerControlRef,
  onControlHover,
  sectionRef,
  shelfRef,
  registerRef,
  onHover,
  onActivate,
  onMoveApp,
  onResetApps,
  onOpenAppsMenu,
  onEditRow,
  currentTheme,
}: AppsRowProps) {
  const focusedControlStyle = {
    backgroundColor: currentTheme?.accent || 'var(--tv-accent, #38bdf8)',
    color: currentTheme?.accentText || 'var(--tv-accent-text, #ffffff)',
    boxShadow: `0 0 14px ${currentTheme?.glow1 || 'var(--tv-glow, rgba(56,189,248,0.35))'}`,
  }

  return (
    <section ref={sectionRef} aria-labelledby="apps-heading" className="relative">
      {/* Row Header with Organize & Add Controls */}
      <div className="flex items-center justify-between px-[5vw]">
        <div className="flex items-center gap-[1vw]">
          <h2
            id="apps-heading"
            className="text-[clamp(14px,1.1vw,22px)] font-semibold tracking-tight text-white/85"
          >
            My Apps
          </h2>
          <span
            className="rounded-full px-[0.75em] py-[0.15em] text-[clamp(10px,0.72vw,14px)] font-bold border transition-colors"
            style={{
              backgroundColor: currentTheme?.glow1 ? currentTheme.glow1 : 'rgba(255,255,255,0.1)',
              borderColor: currentTheme?.accent || 'rgba(255,255,255,0.2)',
              color: currentTheme?.accent || '#ffffff',
            }}
          >
            {apps.length}
          </span>
        </div>

        {/* Organize Mode Toggle & Actions */}
        <div className="flex items-center gap-[0.8vw]">
          {isOrganizeMode ? (
            <>
              <button
                ref={registerControlRef(0)}
                onMouseEnter={() => onControlHover(0)}
                type="button"
                onClick={onEditRow}
                aria-label="Add or remove apps from Home row"
                className={cn("flex items-center gap-1.5 rounded-full bg-white/10 px-[0.9em] py-[0.35em] text-[clamp(11px,0.75vw,15px)] font-medium text-white/80 outline-none transition-colors hover:bg-white/20 hover:text-white", focusedControl === 0 && "ring-2 ring-[var(--tv-accent)]")}
                style={focusedControl === 0 ? focusedControlStyle : undefined}
              >
                <LayoutGrid className="size-[1.1em]" />
                <span>Add / Remove{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}</span>
              </button>
              <button
                ref={registerControlRef(1)}
                onMouseEnter={() => onControlHover(1)}
                type="button"
                onClick={onResetApps}
                aria-label="Reset apps to default order"
                className={cn("flex items-center gap-1.5 rounded-full bg-white/10 px-[0.9em] py-[0.35em] text-[clamp(11px,0.75vw,15px)] font-medium text-white/80 outline-none", focusedControl === 1 && "ring-2 ring-[var(--tv-accent)]")}
                style={focusedControl === 1 ? focusedControlStyle : undefined}
              >
                <RotateCcw className="size-[1.1em]" />
                <span>Reset</span>
              </button>
              <button
                ref={registerControlRef(2)}
                onMouseEnter={() => onControlHover(2)}
                type="button"
                onClick={() => onSetOrganize(false)}
                aria-label="Exit organize mode"
                className={cn("flex items-center gap-1.5 rounded-full bg-white/10 px-[1.1em] py-[0.35em] text-[clamp(11px,0.75vw,15px)] font-bold text-white/80 outline-none transition-transform hover:scale-105")}
                style={focusedControl === 2 ? focusedControlStyle : undefined}
              >
                <Check className="size-[1.1em]" />
                <span>Done</span>
              </button>
            </>
          ) : (
            <button
              ref={registerControlRef(0)}
              onMouseEnter={() => onControlHover(0)}
              type="button"
              onClick={() => onSetOrganize(true)}
              aria-label="Organize and reorder apps"
              className="flex items-center gap-1.5 rounded-full border-0 outline-none bg-white/10 px-[0.95em] py-[0.3em] text-[clamp(11px,0.75vw,15px)] font-medium text-white/70 transition-all hover:bg-white/20 hover:text-white"
              style={focusedControl === 0 ? {
                backgroundColor: currentTheme?.accent || 'var(--tv-accent)',
                color: currentTheme?.accentText || 'var(--tv-accent-text)',
                boxShadow: `0 0 14px ${currentTheme?.glow1 || 'var(--tv-glow)'}`,
              } : undefined}
            >
              <SlidersHorizontal className="size-[1.1em]" />
              <span>Organize</span>
            </button>
          )}
        </div>
      </div>

      {isOrganizeMode && (
        <p className="px-[5vw] pt-[1.5vh] text-[clamp(11px,0.8vw,16px)] text-white/75" role="status">
          {movingApp ? 'Move left or right · Select to place · Back to finish moving' : 'Choose an app and press Select to move it · Up for Add / Remove · Back to finish'}
        </p>
      )}
      {/* Main Apps Shelf */}
      <ul
        ref={shelfRef}
        className="no-scrollbar relative flex gap-[2.4vw] overflow-x-auto px-[5vw] pb-[5vh] pt-[2.4vh]"
      >
        {apps.map((id, index) => {
          const focused = focusedIndex === index
          const service = services[id]
          if (!service) return null
          const isFirst = index === 0
          const isLast = index === apps.length - 1

          return (
            <li key={id} className="relative shrink-0 flex flex-col items-center">
              {/* In Organize Mode: Move Pill Bar */}
              {isOrganizeMode && focused && movingApp && (
                <div
                  className={cn(
                    'absolute -top-3 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full bg-black/90 p-1 shadow-xl ring-1 ring-white/20',
                    focused ? 'opacity-100 scale-105 ring-white/60' : 'opacity-80',
                  )}
                >
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveApp(index, index - 1)
                    }}
                    aria-label={`Move ${service.name} left`}
                    className={cn(
                      'grid size-7 place-items-center rounded-full text-white transition-colors',
                      isFirst
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-white/25 active:bg-white active:text-black',
                    )}
                  >
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveApp(index, index + 1)
                    }}
                    aria-label={`Move ${service.name} right`}
                    className={cn(
                      'grid size-7 place-items-center rounded-full text-white transition-colors',
                      isLast
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-white/25 active:bg-white active:text-black',
                    )}
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Main App Launch Tile */}
              <button
                ref={registerRef(index)}
                type="button"
                onMouseEnter={() => onHover(index)}
                onClick={() => {
                  onActivate(index)
                }}
                aria-label={isOrganizeMode ? `${movingApp && focused ? 'Place' : 'Move'} ${service.name}` : `Open ${service.name}`}
                className="flex w-[clamp(110px,9.5vw,210px)] flex-col items-center outline-none"
              >
                <span
                  className={cn(
                    'relative grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-[clamp(12px,1vw,22px)]',
                    'transition-transform duration-200 ease-out',
                    focused
                      ? 'scale-110 shadow-[0_24px_50px_-14px_rgba(0,0,0,0.9)] ring-[1.5px] ring-[var(--tv-accent,white)] backdrop-blur-sm'
                      : 'bg-transparent ring-0',
                    isOrganizeMode && movingApp && focused && 'ring-2 ring-[var(--tv-accent)]',
                  )}
                  style={focused ? { backgroundColor: 'var(--tv-glass, rgba(255,255,255,0.12))' } : undefined}
                >
                  <ServiceLogo
                    id={id}
                    className={cn(
                      service.native
                        ? 'size-full rounded-[inherit] object-cover transition-opacity duration-300'
                        : 'h-[42%] w-[62%] transition-[opacity,transform] duration-300',
                      focused ? 'scale-105 opacity-100' : 'opacity-80',
                    )}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-[1.6vh] text-[clamp(11px,0.8vw,16px)] font-medium transition-[opacity,transform] duration-300',
                    focused ? 'translate-y-[0.4vh] opacity-100' : 'opacity-0',
                  )}
                  style={focused ? { color: 'var(--tv-accent, #ffffff)' } : { color: '#ffffff' }}
                >
                  {service.name}
                </span>
              </button>
            </li>
          )
        })}

        {/* Single Dedicated All Apps Shelf Tile */}
        <li className="shrink-0 flex flex-col items-center">
          {(() => {
            const isAllAppsFocused = focusedIndex === apps.length
            const accentColor = currentTheme?.accent || 'var(--tv-accent, #38bdf8)'
            const glowColor = currentTheme?.glow1 || 'var(--tv-glow, rgba(56,189,248,0.35))'

            return (
              <button
                ref={registerRef(apps.length)}
                type="button"
                onMouseEnter={() => onHover(apps.length)}
                onClick={() => {
                  onOpenAppsMenu?.()
                }}
                aria-label="Open All Apps library"
                className="group flex w-[clamp(110px,9.5vw,210px)] flex-col items-center outline-none"
              >
                <span
                  className={cn(
                    'relative grid aspect-[16/10] w-full place-items-center rounded-[clamp(12px,1vw,22px)] transition-transform duration-200 ease-out overflow-hidden',
                    isAllAppsFocused
                      ? 'scale-110 shadow-[0_24px_50px_-14px_rgba(0,0,0,0.9)] ring-[1.5px] ring-[var(--tv-accent,white)] backdrop-blur-sm'
                      : 'border group-hover:scale-102',
                  )}
                  style={
                    isAllAppsFocused
                      ? {
                          backgroundColor: 'var(--tv-glass, rgba(255,255,255,0.14))',
                          boxShadow: `0 0 28px ${glowColor}`,
                          borderColor: accentColor,
                        }
                      : {
                          backgroundColor: 'var(--tv-glass, rgba(255,255,255,0.06))',
                          borderColor: 'var(--tv-glass-border, rgba(255,255,255,0.18))',
                        }
                  }
                >
                  {/* Clean solid subtle glow inside card on focus */}
                  {isAllAppsFocused && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-[50%] opacity-20 blur-xl"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1.5 transition-colors">
                    {/* Themed Icon Container */}
                    <div
                      className={cn(
                        'grid size-8 place-items-center rounded-xl transition-all duration-300',
                        isAllAppsFocused
                          ? 'shadow-md scale-110'
                          : 'bg-white/10 group-hover:bg-white/15',
                      )}
                      style={{
                        backgroundColor: isAllAppsFocused ? accentColor : undefined,
                        color: isAllAppsFocused ? (currentTheme?.accentText || '#ffffff') : accentColor,
                        boxShadow: `0 0 12px ${glowColor}`,
                      }}
                    >
                      <LayoutGrid className="size-4.5 stroke-[2.2]" />
                    </div>
                    <span
                      className="text-[clamp(11px,0.76vw,14px)] font-bold tracking-tight text-white transition-colors"
                      style={isAllAppsFocused ? { color: accentColor } : undefined}
                    >
                      All Apps
                    </span>
                  </div>
                </span>
                <span
                  className={cn(
                    'mt-[1.6vh] text-[clamp(11px,0.8vw,16px)] font-medium transition-[opacity,transform,color] duration-300',
                    isAllAppsFocused ? 'translate-y-[0.4vh] opacity-100 font-semibold' : 'opacity-60 text-white/60',
                  )}
                  style={isAllAppsFocused ? { color: accentColor } : undefined}
                >
                  App Library
                </span>
              </button>
            )
          })()}
        </li>
      </ul>

    </section>
  )
}
