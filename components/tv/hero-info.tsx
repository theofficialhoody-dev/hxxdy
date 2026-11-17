'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HeroSlide } from '@/lib/launcher-data'
import { ServiceBadge } from './service-logo'
import { FlowFill } from './flow-fill'

type HeroInfoProps = {
  slides: HeroSlide[]
  activeIndex: number
  focused: boolean
  visible: boolean
  paused: boolean
  slideDuration: number
  playRef: (el: HTMLElement | null) => void
  onHover: () => void
  onPlay: () => void
  onSelectSlide: (index: number) => void
}

export function HeroInfo({
  slides,
  activeIndex,
  focused,
  visible,
  paused,
  slideDuration,
  playRef,
  onHover,
  onPlay,
  onSelectSlide,
}: HeroInfoProps) {
  const slide = slides[activeIndex]
  if (!slide) return <section aria-hidden="true" className="h-[64dvh]" />

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      data-tv-paused={!visible || paused || undefined}
      className={cn(
        'flex flex-col justify-start px-[5vw] pt-[clamp(68px,8.5vh,96px)] pb-[2vh] transition-opacity duration-300 ease-out',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div
        key={slide.id}
        aria-live="polite"
        className="flex max-w-[clamp(340px,42vw,800px)] flex-col items-start gap-[1.6vh] animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {/* Eyebrow and Service Badge - Fixed aligned with weather/clock baseline */}
        <div className="flex -translate-y-[3px] items-center gap-[0.8vw] text-[clamp(11px,0.8vw,16px)]">
          <ServiceBadge id={slide.service} name={slide.appName}
            icon={slide.appName === 'Nuvio' && slide.appIcon?.startsWith('https://launcher.local/__icon/')
              ? 'https://launcher.local/__app_icon/com.nuvio.tv' : slide.appIcon}
            iconClassName={slide.appName === 'Nuvio' ? 'rounded-[25%]' : undefined} withName />
          <span className="font-medium uppercase tracking-[0.18em] text-white/70">{slide.eyebrow}</span>
        </div>

        {/* Grand, Majestic Title Logo as the Main Visual Focus */}
        {slide.logo && slide.logoIsAlpha ? (
          <h2 className="relative h-[clamp(110px,16.5vh,200px)] w-[clamp(320px,40vw,720px)]">
            <span className="sr-only">{slide.title}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <TitleLogo key={slide.logo} src={slide.logo} title={slide.title} />
          </h2>
        ) : !slide.logo ? (
          <h2 className="flex h-[clamp(110px,16.5vh,200px)] w-[clamp(320px,40vw,720px)] items-center text-balance text-[clamp(28px,3.4vw,72px)] font-semibold leading-tight tracking-tight text-white">
            <span className="line-clamp-2">{slide.title}</span>
          </h2>
        ) : (
        <h2 className="relative h-[clamp(110px,16.5vh,200px)] w-[clamp(320px,40vw,720px)] drop-shadow-[0_6px_32px_rgba(0,0,0,0.7)]">
          <span className="sr-only">{slide.title}</span>
          {/* Title art ships on black; a luminance mask keys the black out so only the lettering shows. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-contain bg-left bg-no-repeat brightness-125"
            style={{
              backgroundImage: `url(${slide.logo})`,
              maskImage: `url(${slide.logo})`,
              WebkitMaskImage: `url(${slide.logo})`,
              maskMode: 'luminance',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'left center',
              WebkitMaskPosition: 'left center',
            }}
          />
        </h2>
        )}

        <div className="flex flex-wrap items-center gap-x-[0.7em] gap-y-2 text-[clamp(12px,0.95vw,19px)] text-white/75">
          {slide.meta.map((item, i) => (
            <span key={item} className="flex items-center gap-[0.7em]">
              {i > 0 && <span className="size-[0.25em] rounded-full bg-white/40" aria-hidden="true" />}
              {item}
            </span>
          ))}
          <span className="ml-[0.3em] flex gap-[0.4em]">
            {slide.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-[0.35em] px-[0.45em] py-[0.1em] text-[0.78em] font-semibold tracking-wide text-white/80 ring-1 ring-inset ring-white/30"
              >
                {badge}
              </span>
            ))}
          </span>
        </div>

        <p className="line-clamp-2 text-pretty text-[clamp(13px,1.05vw,21px)] leading-relaxed text-white/70">{slide.synopsis}</p>
      </div>

      <div className="mt-[2.4vh] flex items-center justify-between gap-6">
        <div className="flex items-center gap-[1vw]">
          {/* Modern Apple TV / Google TV 1px Hairline Glowing Gradient Border Button */}
          <div
            className={cn(
              'relative inline-flex rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
              focused ? 'scale-105' : 'scale-100',
            )}
          >
            {/* Subtle, tight ambient neon halo (1px hairline precision) */}
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -inset-[1px] rounded-full blur-[4px] transition-opacity duration-300',
                focused ? 'opacity-75' : 'opacity-0',
              )}
              style={{
                background:
                  'linear-gradient(135deg, var(--tv-accent, #00f0ff) 0%, var(--tv-glow-2, #a855f7) 50%, var(--tv-accent, #00f0ff) 100%)',
              }}
            />

            {/* 1px Hairline Glowing Gradient Border Container */}
            <div
              className={cn(
                'relative p-[2px] rounded-full overflow-hidden transition-all duration-300',
                focused ? 'shadow-lg' : 'bg-white/20',
              )}
            >
              {/* Rotating Gradient Border Beam on Focus */}
              {focused && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-[100%] animate-[spin_4s_linear_infinite] will-change-transform"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, var(--tv-accent, #00f0ff) 0%, var(--tv-glow-2, #a855f7) 38%, var(--tv-accent, #00f0ff) 68%, var(--tv-accent, #00f0ff) 100%)',
                  }}
                />
              )}

              {/* Modern Matte Smoked Frosted Glass Button Body (No Outdated Gloss/Glare) */}
              <button
                ref={playRef}
                type="button"
                onMouseEnter={onHover}
                onClick={onPlay}
                aria-label={`Play ${slide.title}`}
                className={cn(
                  'relative flex h-[clamp(42px,3.2vw,60px)] items-center gap-[0.65em] rounded-full px-[1.8em] text-[clamp(14px,1.05vw,20px)] font-bold outline-none overflow-hidden transition-all duration-300',
                  focused
                    ? 'bg-neutral-950/90 text-white backdrop-blur-xl'
                    : 'bg-black/60 text-white/85 backdrop-blur-md hover:bg-black/80 hover:text-white',
                )}
              >
                {/* Clean, high-contrast white Play icon with subtle theme glow */}
                <Play
                  className={cn(
                    'relative z-10 size-[1.05em] fill-white text-white transition-all duration-300',
                    focused
                      ? 'drop-shadow-[0_0_8px_var(--tv-accent,rgba(56,189,248,0.85))]'
                      : 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10 font-bold tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  Play
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[0.5vw]" role="tablist" aria-label="Featured titles">
          {slides.map((s, index) => {
            const active = index === activeIndex
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                tabIndex={-1}
                aria-selected={active}
                aria-label={s.title}
                onClick={() => onSelectSlide(index)}
                className={cn(
                  'relative h-[clamp(4px,0.32vw,7px)] overflow-hidden rounded-full bg-white/30 transition-[width] duration-500 ease-out',
                  active ? 'w-[clamp(28px,2.4vw,52px)]' : 'w-[clamp(4px,0.32vw,7px)] hover:bg-white/60',
                )}
              >
                {active && (
                  <span
                    key={`${s.id}-${paused}`}
                    className="absolute inset-0 origin-left rounded-full animate-slide-progress overflow-hidden"
                    style={{
                      animationDuration: `${slideDuration}ms`,
                      animationPlayState: paused ? 'paused' : 'running',
                      boxShadow: '0 0 10px var(--tv-accent, #00f0ff), 0 0 16px var(--tv-glow-2, #a855f7)',
                    }}
                  >
                    <FlowFill />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/**
 * Transparent title art, tuned for dark backgrounds. Logos that are mostly dark would vanish on the
 * backdrop, so they are flattened to white; colourful or light logos are left untouched.
 */
function TitleLogo({ src, title }: { src: string; title: string }) {
  const [light, setLight] = useState(false)
  // 0 = CORS fetch (lets us measure brightness), 1 = plain fetch, 2 = failed -> text title
  const [attempt, setAttempt] = useState(0)
  if (attempt > 1) {
    return <span className="flex h-full items-center text-balance text-[clamp(28px,3.4vw,72px)] font-semibold leading-tight tracking-tight text-white">{title}</span>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      crossOrigin={attempt === 0 ? "anonymous" : undefined}
      onError={() => setAttempt((a) => a + 1)}
      className={cn(
        'size-full object-contain object-left drop-shadow-[0_6px_32px_rgba(0,0,0,0.7)]',
        light && 'brightness-0 invert',
      )}
      decoding="async"
      onLoad={(e) => {
        try {
          const img = e.currentTarget
          const c = document.createElement('canvas')
          c.width = 48
          c.height = Math.max(1, Math.round((48 * img.naturalHeight) / Math.max(1, img.naturalWidth)))
          const ctx = c.getContext('2d', { willReadFrequently: true })
          if (!ctx) return
          ctx.drawImage(img, 0, 0, c.width, c.height)
          const d = ctx.getImageData(0, 0, c.width, c.height).data
          let sum = 0
          let n = 0
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 128) continue
            sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
            n++
          }
          if (n > 0 && sum / n < 0.35) setLight(true)
        } catch {
          // tainted canvas (no CORS): leave the logo as is
        }
      }}
    />
  )
}