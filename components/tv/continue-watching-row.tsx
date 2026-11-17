'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'
import { memo, useMemo, type Ref } from 'react'
import { cn } from '@/lib/utils'
import { services, type ContinueItem } from '@/lib/launcher-data'
import { ServiceBadge } from './service-logo'
import { FlowFill } from './flow-fill'

type ContinueWatchingRowProps = {
  items: ContinueItem[]
  focusedIndex: number
  sectionRef: Ref<HTMLElement>
  shelfRef: Ref<HTMLUListElement>
  registerRef: (index: number) => (el: HTMLElement | null) => void
  onHover: (index: number) => void
  onActivate: (index: number) => void
}

// Tiles are ~220px wide (440 device px), so TMDB's 1280px renditions only add decode and memory cost.
function tileImage(src: string) {
  return src ? src.replace('image.tmdb.org/t/p/w1280/', 'image.tmdb.org/t/p/w500/') : src
}

type ContinueCardProps = {
  item: ContinueItem
  index: number
  focused: boolean
  registerRef: (index: number) => (el: HTMLElement | null) => void
  onHover: (index: number) => void
  onActivate: (index: number) => void
}

// Memoized so moving focus only re-renders the two tiles whose focused state changed, not the whole shelf.
const ContinueCard = memo(function ContinueCard({ item, index, focused, registerRef, onHover, onActivate }: ContinueCardProps) {
  const percent = Math.round(item.progress * 100)
  const ref = useMemo(() => registerRef(index), [registerRef, index])
  return (
            <li key={item.id} className="shrink-0">
              <button
                ref={ref}
                type="button"
                onMouseEnter={() => onHover(index)}
                onClick={() => onActivate(index)}
                aria-label={item.historyOnly ? `Open ${item.title}, recently watched on ${item.appName ?? 'app'}` : `Resume ${item.title}, ${item.detail}, ${item.remaining}, ${percent}% watched, on ${(item.service ? services[item.service].name : item.appName) ?? 'app'}`}
                className="group block w-[clamp(220px,20vw,440px)] text-left outline-none"
              >
                <div
                  className={cn(
                    'relative aspect-video overflow-hidden rounded-[clamp(10px,0.8vw,18px)] bg-white/5',
                    'transition-transform duration-200 ease-out',
                    focused
                      ? 'shadow-[0_28px_60px_-12px_rgba(0,0,0,0.85)] ring-[1.5px] ring-[var(--tv-accent,white)] scale-[1.04]'
                      : 'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ring-0',
                  )}
                >
                  <Image
                    src={tileImage(item.image) || '/placeholder.svg'}
                    alt=""
                    decoding="async"
                    fill
                    sizes="(min-width: 1024px) 20vw, 220px"
                    referrerPolicy="no-referrer"
                    className={cn(
                      'object-cover transition-transform duration-500 ease-out',
                      focused ? 'scale-105' : 'scale-100',
                    )}
                  />

                  {/* Multi-layered cinematic gradient overlay for futuristic depth and readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35" />

                  {/* Top Badges: Service Logo + Format Spec */}
                  <div className="absolute inset-x-[0.7vw] top-[0.7vw] flex items-center justify-between pointer-events-none">
                    {item.pkg === 'com.nuvio.tv' ? (
                      <span className="inline-flex rounded-full bg-black/55 p-1">
                        {/* Android supplies the actual application icon, not its wide banner. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://launcher.local/__app_icon/com.nuvio.tv" alt="Nuvio" className="size-[clamp(18px,1.3vw,26px)] rounded object-contain" />
                      </span>
                    ) : <ServiceBadge
                      id={item.service}
                      name={item.appName}
                      icon={item.appIcon}
                      className="text-[clamp(10px,0.7vw,14px)] shadow-sm"
                    />}
                    {item.quality && (
                      <span className="rounded-full bg-black/45 px-[0.55em] py-[0.18em] text-[clamp(9px,0.62vw,12px)] font-medium tracking-wider text-white/70 ring-1 ring-white/15 backdrop-blur-sm">
                        {item.quality}
                      </span>
                    )}
                  </div>

                  {/* Show / Movie Official Title Logo Treatment */}
                  <div className="absolute inset-x-0 bottom-[clamp(12px,1.1vw,18px)] px-[clamp(10px,0.9vw,16px)] flex items-end justify-between pointer-events-none gap-2">
                    <div className="relative h-[clamp(24px,2.2vw,38px)] w-[clamp(120px,11vw,190px)] max-w-[72%]">
                      {item.logo && <Image
                        src={item.logo}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 11vw, 150px"
                        referrerPolicy="no-referrer"
                        className={cn(
                          'object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-[transform,opacity] duration-200 ease-out',
                          focused
                            ? 'scale-105 opacity-100'
                            : 'opacity-90',
                        )}
                      />}
                    </div>

                    {/* Apple TV 4K / Neon 1px Hairline Glowing Gradient Border Resume Play indicator */}
                    <div
                      className={cn(
                        'relative flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                        focused
                          ? 'scale-100 opacity-100'
                          : 'scale-50 opacity-0 pointer-events-none',
                      )}
                    >
                      {/* Subtle, tight ambient neon halo (1px hairline precision) */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-[1px] rounded-full blur-[4px] opacity-75"
                        style={{
                          background:
                            'linear-gradient(135deg, var(--tv-accent, #00f0ff) 0%, var(--tv-glow-2, #a855f7) 100%)',
                        }}
                      />

                      {/* 1px Hairline Rotating Gradient Border Container */}
                      <div className="relative p-[1px] rounded-full overflow-hidden">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'pointer-events-none absolute -inset-[100%] animate-[spin_4s_linear_infinite]',
                            // Only the focused tile's beam needs to spin; the rest are invisible.
                            focused ? 'will-change-transform' : '[animation-play-state:paused]',
                          )}
                          style={{
                            background:
                              'conic-gradient(from 0deg at 50% 50%, var(--tv-accent, #00f0ff) 0%, var(--tv-glow-2, #a855f7) 50%, var(--tv-accent, #00f0ff) 100%)',
                          }}
                        />

                        {/* Modern Matte Dark Smoked Glass Body (No Outdated Gloss) */}
                        <div className="relative flex size-[clamp(28px,2.4vw,40px)] shrink-0 items-center justify-center rounded-full bg-neutral-950/90 backdrop-blur-md">
                          <Play
                            className="relative z-10 size-[48%] fill-white text-white drop-shadow-[0_0_6px_var(--tv-accent,rgba(56,189,248,0.85))] translate-x-[0.5px]"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Radial glow highlight on hover/focus */}
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 transition-opacity duration-300',
                      focused ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{
                      background:
                        'radial-gradient(circle at var(--gx, 30%) var(--gy, 0%), var(--tv-glow, rgba(255,255,255,0.22)), transparent 55%)',
                    }}
                  />

                  {/* Clean Glowing Animated Progress Bar (No borders, pure gradient glow effect) */}
                  {!item.historyOnly && <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                    {/* Ambient upward gradient glow when focused */}
                    {focused && (
                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 h-[6px] blur-[4px] opacity-85 transition-[width] duration-500 ease-out pointer-events-none"
                        style={{
                          width: `${percent}%`,
                          background:
                            'linear-gradient(90deg, var(--tv-accent, #00f0ff) 0%, var(--tv-glow-2, #a855f7) 40%, var(--tv-accent, #00f0ff) 70%, var(--tv-accent, #00f0ff) 100%)',
                          backgroundSize: '200% 100%',
                        }}
                      />
                    )}

                    {/* Progress Track and Bar */}
                    <div
                      className={cn(
                        'relative w-full bg-white/20 overflow-hidden transition-all duration-300',
                        focused ? 'h-[clamp(2.5px,calc(0.2vw+0.5px),4px)]' : 'h-[clamp(2.5px,calc(0.16vw+0.5px),3.5px)]',
                      )}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="h-full transition-[width] duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      >
                        {focused ? (
                          <div className="relative h-full w-full">
                            <FlowFill />
                          </div>
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              background:
                                'linear-gradient(90deg, rgba(255,255,255,0.65) 0%, var(--tv-accent, rgba(255,255,255,0.85)) 100%)',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>}
                </div>

                {/* Card Subtitle Information */}
                <div
                  className={cn(
                    'mt-[1.6vh] transition-[opacity,transform] duration-300 ease-out',
                    focused ? 'translate-y-[0.4vh] opacity-100' : 'opacity-65',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[clamp(13px,0.95vw,19px)] font-medium text-white tracking-tight">
                      {item.title}
                    </p>
                    {!item.historyOnly && <span
                      className={cn(
                        'shrink-0 text-[clamp(10px,0.72vw,14px)] font-mono',
                        focused ? 'font-bold' : 'text-white/65',
                      )}
                      style={focused ? { color: 'var(--tv-accent, #00f0ff)' } : undefined}
                    >
                      {percent}%
                    </span>}
                  </div>
                  <p className="truncate text-[clamp(11px,0.8vw,16px)] text-white/55">
                    {item.detail}
                    {item.remaining && <><span aria-hidden="true">{' · '}</span>{item.remaining}</>}
                  </p>
                </div>
              </button>
            </li>
  )
})

function ContinueWatchingRowBase({
  items,
  focusedIndex,
  sectionRef,
  shelfRef,
  registerRef,
  onHover,
  onActivate,
}: ContinueWatchingRowProps) {
  return (
    <section ref={sectionRef} aria-labelledby="continue-heading" className="relative">
      <div className="px-[5vw]">
        <h2
          id="continue-heading"
          className="text-[clamp(14px,1.1vw,22px)] font-semibold tracking-tight text-white/85"
        >
          Continue Watching
        </h2>
      </div>
      <ul
        ref={shelfRef}
        className="no-scrollbar relative flex gap-[1.6vw] overflow-x-auto px-[5vw] pb-[3vh] pt-[2.4vh]"
      >
        {items.map((item, index) => (
          <ContinueCard
            key={item.id}
            item={item}
            index={index}
            focused={focusedIndex === index}
            registerRef={registerRef}
            onHover={onHover}
            onActivate={onActivate}
          />
        ))}
      </ul>
    </section>
  )
}

export const ContinueWatchingRow = memo(ContinueWatchingRowBase)
