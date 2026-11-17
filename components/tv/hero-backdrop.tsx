'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { HeroSlide } from '@/lib/launcher-data'

export function HeroBackdrop({
  slides,
  activeIndex,
  dimmed,
  kenBurns = true,
  liveWallpaper = true,
  paused = false,
}: {
  slides: HeroSlide[]
  activeIndex: number
  dimmed: boolean
  kenBurns?: boolean
  liveWallpaper?: boolean
  paused?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Manage video playback based on whether user is browsing continue watching / my apps
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.defaultMuted = true
    video.muted = true

    if (dimmed && liveWallpaper !== false && !paused) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Inline autoplay safe catch
        })
      }
    } else {
      video.pause()
    }
  }, [dimmed, liveWallpaper, paused])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" data-tv-paused={paused || undefined}>
      {/* Primary Hero Slide Backdrops */}
      {slides.map((slide, index) => {
        const active = index === activeIndex
        const n = slides.length
        // Only the current, next and previous slides stay mounted to keep decoded image memory low.
        if (!(active || index === (activeIndex + 1) % n || index === (activeIndex - 1 + n) % n)) return null
        return (
          <div
            key={slide.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-out',
              active ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={slide.backdrop || '/placeholder.svg'}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              referrerPolicy="no-referrer"
              // While browsing the shelves the backdrop is dimmed: a static scale avoids keeping a full-screen
              // animated compositor layer alive (it measurably costs frames) without changing how it looks.
              className={cn('object-cover', active && kenBurns && (dimmed ? 'scale-[1.05]' : 'animate-kenburns'))}
            />
          </div>
        )
      })}

      {/* Hero Vignette Gradients */}
      <div className="absolute inset-x-0 top-0 h-[28vh] bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[65vw] bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[75vh] bg-gradient-to-t from-black via-black/55 to-transparent" />

      {/* Thematic Ambient Aura Layers - Optimized for Mali GPU without blend-mode readbacks */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 60% at 70% 25%, var(--tv-glow, rgba(56, 189, 248, 0.22)), transparent 65%),
            radial-gradient(ellipse 70% 50% at 15% 80%, var(--tv-glow-2, rgba(59, 130, 246, 0.15)), transparent 70%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 45%, var(--tv-bg, #000000) 100%)',
          opacity: 0.75,
        }}
      />

      {/* Lightweight Edge Vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-black/60"
      />

      {/* Only mounted when enabled so the video decoder isn't initialised for nothing. */}
      {liveWallpaper !== false && (
        <>
      {/* Secondary Live Wallpaper: Goku Black Super Saiyan Rosé (plays when scrolling down to Continue Watching & My Apps) */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500 ease-out overflow-hidden',
          dimmed ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          poster="/assets/aistudio/goku-black-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover filter brightness-95 contrast-105"
        >
          <source src="/assets/aistudio/goku-black-wallpaper.mp4" type="video/mp4" />
        </video>

        {/* Cinematic Backdrop Scrim Overlays: Balanced for maximum wallpaper visibility and card text legibility */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 top-0 h-[22vh] bg-gradient-to-b from-black/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 50% 45%, transparent 35%, rgba(0, 0, 0, 0.35) 100%),
              radial-gradient(ellipse 90% 60% at 50% 85%, var(--tv-glow, transparent), transparent 70%)
            `,
          }}
        />
      </div>
        </>
      )}

      {/* Standard Fallback Dimmer when live wallpaper is disabled */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500 ease-out',
          dimmed && liveWallpaper === false ? 'opacity-65' : 'opacity-0',
        )}
        style={{ backgroundColor: 'var(--tv-bg, #000000)' }}
      />
    </div>
  )
}
