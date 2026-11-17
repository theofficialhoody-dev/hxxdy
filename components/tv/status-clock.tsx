'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from 'lucide-react'
import { isNative } from '@/lib/native-bridge'

type Weather = { temperature: number; code: number; isDay: boolean }

function weatherAppearance(weather: Weather) {
  const { code, isDay } = weather
  if (code === 0) return { Icon: isDay ? Sun : Moon, label: 'Clear' }
  if (code <= 2) return { Icon: CloudSun, label: 'Partly cloudy' }
  if (code === 3) return { Icon: Cloud, label: 'Cloudy' }
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Fog' }
  if (code >= 95) return { Icon: CloudLightning, label: 'Thunderstorm' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { Icon: CloudSnow, label: 'Snow' }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { Icon: CloudRain, label: 'Rain' }
  return { Icon: Cloud, label: 'Weather' }
}

function getFormattedTime(is24h: boolean) {
  const now = new Date()
  let hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  if (is24h) {
    return {
      time: `${hours.toString().padStart(2, '0')}:${minutes}`,
      period: '',
    }
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return {
    time: `${hours}:${minutes}`,
    period,
  }
}

export function StatusClock({
  clock24h = false,
  showWeather = true,
}: {
  clock24h?: boolean
  showWeather?: boolean
}) {
  const [timeState, setTimeState] = useState(() => getFormattedTime(clock24h))
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    if (!showWeather || !isNative()) {
      setWeather(null)
      return
    }
    let active = true
    let pending = false
    let timer: number | undefined
    const refresh = async () => {
      if (pending || !active) return
      window.clearTimeout(timer)
      pending = true
      let nextRefresh = Date.now() + 5 * 60 * 1000
      try {
        const response = await fetch('/__weather', { cache: 'no-store' })
        const data = await response.json() as Weather & { refreshAt?: number; retryAt?: number }
        if (!response.ok) {
          if (Number.isFinite(data.retryAt)) nextRefresh = data.retryAt!
          throw new Error('Weather unavailable')
        }
        if (!Number.isFinite(data.temperature) || !Number.isInteger(data.code) ||
            typeof data.isDay !== 'boolean' || !Number.isFinite(data.refreshAt)) {
          throw new Error('Invalid weather')
        }
        nextRefresh = data.refreshAt!
        if (active) setWeather(data)
      } catch {
        if (active) setWeather(null)
      } finally {
        pending = false
        if (active) timer = window.setTimeout(refresh, Math.max(1000, nextRefresh - Date.now()))
      }
    }
    void refresh()
    window.addEventListener('launcher:resume', refresh)
    return () => {
      active = false
      window.clearTimeout(timer)
      window.removeEventListener('launcher:resume', refresh)
    }
  }, [showWeather])

  const appearance = weather ? weatherAppearance(weather) : null

  useEffect(() => {
    setTimeState(getFormattedTime(clock24h))
    const interval = window.setInterval(() => {
      setTimeState(getFormattedTime(clock24h))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [clock24h])

  return (
    <div className="flex items-center gap-[1.1vw] text-[clamp(14px,1.1vw,24px)] font-medium tabular-nums text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
      {showWeather && weather && appearance && (
        <>
          <span className="flex items-center gap-[0.4em]" aria-label={`${appearance.label}, ${Math.round(weather.temperature)} degrees Fahrenheit`}>
            <appearance.Icon className="size-[1.15em]" strokeWidth={1.5} aria-hidden="true" />
            <span>{Math.round(weather.temperature)}°</span>
          </span>
          <span className="h-[1em] w-px bg-white/30" aria-hidden="true" />
        </>
      )}
      <time suppressHydrationWarning className="inline-flex items-baseline font-semibold tracking-tight text-white">
        <span>{timeState.time}</span>
        {timeState.period && (
          <span className="ml-[0.3em] text-[0.72em] font-medium text-white/75">
            {timeState.period}
          </span>
        )}
      </time>
    </div>
  )
}
