'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock,
  Cpu,
  Globe,
  HardDrive,
  Info,
  LayoutGrid,
  Monitor,
  RefreshCw,
  RotateCcw,
  Sliders,
  Tv,
  User,
  Volume2,
  Wifi,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ThemeConfig } from '@/lib/theme-data'
import { FlowFill } from './flow-fill'
import { getDisplayInfo, getNetwork, type DisplayInfo, type NetworkInfo } from '@/lib/native-bridge'
import { getLastNavigationSoundVolume, getNavigationSoundVolume, setNavigationSoundVolume } from '@/lib/navigation-sounds'

export type LauncherSettings = {
  kenBurns: boolean
  autoAdvanceHero: boolean
  clock24h: boolean
  showWeather: boolean
  liveWallpaper: boolean
}

export const DEFAULT_SETTINGS: LauncherSettings = {
  kenBurns: true,
  autoAdvanceHero: true,
  clock24h: false,
  showWeather: true,
  liveWallpaper: false,
}

export function getStoredSettings(): LauncherSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem('tv_launcher_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        liveWallpaper: parsed.liveWallpaper === true,
      }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

export function saveStoredSettings(settings: LauncherSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tv_launcher_settings', JSON.stringify(settings))
  } catch {}
}

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  settings: LauncherSettings
  onUpdateSettings: (newSettings: LauncherSettings) => void
  onResetApps: () => void
  installedAppsCount: number
  currentTheme: ThemeConfig
  /** Real Android settings screens; only provided when running inside the native shell. */
  onOpenSystemSettings?: () => void
  onOpenDisplaySettings?: () => void
  onOpenSoundSettings?: () => void
  onOpenWifiSettings?: () => void
  onOpenAccountSettings?: () => void
  onSelectProfile: () => void
  activeProfileName?: string
  native: boolean
}

type TabCategory = 'display' | 'launcher' | 'audio' | 'apps' | 'network' | 'system'

const TABS: { id: TabCategory; label: string; icon: any; summary: string }[] = [
  { id: 'display', label: 'Display & Video', icon: Monitor, summary: 'Display mode, HDR & Motion' },
  { id: 'launcher', label: 'Launcher Preferences', icon: Sliders, summary: 'Carousel, Clock & Weather' },
  { id: 'audio', label: 'Audio & Sound', icon: Volume2, summary: 'Launcher sounds & Android audio' },
  { id: 'apps', label: 'Apps & Storage', icon: LayoutGrid, summary: 'App Order & 16GB Storage' },
  { id: 'network', label: 'Network & Account', icon: Wifi, summary: 'Connection & profiles' },
  { id: 'system', label: 'System & About', icon: Info, summary: 'onn. 4K Plus Specifications' },
]

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetApps,
  installedAppsCount,
  currentTheme,
  onOpenSystemSettings,
  onOpenDisplaySettings,
  onOpenSoundSettings,
  onOpenWifiSettings,
  onOpenAccountSettings,
  onSelectProfile,
  activeProfileName,
  native,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('display')
  const [focusSection, setFocusSection] = useState<'tabs' | 'content'>('tabs')
  const [tabIndex, setTabIndex] = useState(0)
  const [contentIndex, setContentIndex] = useState(0)
  const [cacheCleared, setCacheCleared] = useState(false)
  const [updateChecked, setUpdateChecked] = useState(false)
  const [network, setNetwork] = useState<NetworkInfo | null>(null)
  const [display, setDisplay] = useState<DisplayInfo | null>(null)
  const [soundVolume, setSoundVolume] = useState(25)
  const [audioError, setAudioError] = useState('')
  const lastSoundVolume = useRef(25)

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const contentRefs = useRef<(HTMLButtonElement | null)[]>([])
  const contentPanelRef = useRef<HTMLDivElement>(null)

  const contentItems = () => {
    const panel = contentPanelRef.current
    if (!panel) return []
    return Array.from(panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
  }

  useEffect(() => {
    if (isOpen) {
      setFocusSection('tabs')
      setTabIndex(0)
      setContentIndex(0)
      setActiveTab(TABS[0].id)
      setCacheCleared(false)
      setUpdateChecked(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || activeTab !== 'network') return
    const refresh = () => setNetwork(native ? getNetwork() : null)
    refresh()
    window.addEventListener('launcher:resume', refresh)
    return () => window.removeEventListener('launcher:resume', refresh)
  }, [isOpen, activeTab, native])

  useEffect(() => {
    if (!isOpen || activeTab !== 'audio') return
    const volume = getNavigationSoundVolume()
    setSoundVolume(volume)
    lastSoundVolume.current = volume > 0 ? volume : getLastNavigationSoundVolume()
    setAudioError('')
  }, [isOpen, activeTab])

  const updateSoundVolume = (value: number) => {
    const next = Math.min(100, Math.max(0, value))
    try {
      setNavigationSoundVolume(next)
      setSoundVolume(next)
      if (next > 0) lastSoundVolume.current = next
      setAudioError('')
    } catch (error) {
      console.warn('Unable to save navigation sound volume', error)
      setAudioError('Could not save launcher sound volume.')
    }
  }

  useEffect(() => {
    if (!isOpen || activeTab !== 'display') return
    const refresh = () => setDisplay(native ? getDisplayInfo() : null)
    refresh()
    window.addEventListener('launcher:resume', refresh)
    return () => window.removeEventListener('launcher:resume', refresh)
  }, [isOpen, activeTab, native])

  useEffect(() => {
    if (!isOpen) return
    const items = contentItems()
    const target = focusSection === 'tabs' ? tabRefs.current[tabIndex] : items[contentIndex]
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [isOpen, focusSection, tabIndex, contentIndex, activeTab])

  // Remote Navigation Listener (D-Pad support)
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

      if (isBack) {
        e.preventDefault()
        if (focusSection === 'content') setFocusSection('tabs')
        else onClose()
        return
      }

      const soundControl = document.activeElement instanceof HTMLElement && document.activeElement.dataset.launcherSound === 'true'
      if (soundControl && (key === 'ArrowLeft' || key === 'ArrowRight' || code === 21 || code === 22 || code === 37 || code === 39)) {
        e.preventDefault()
        updateSoundVolume(soundVolume + (key === 'ArrowLeft' || code === 21 || code === 37 ? -10 : 10))
        return
      }

      if (['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key) || code === 13 || code === 23 || code === 66) {
        e.preventDefault()
        if (!e.repeat && document.activeElement instanceof HTMLButtonElement) document.activeElement.click()
        return
      }

      if (key === 'ArrowUp' || code === 38 || code === 19) {
        e.preventDefault()
        if (focusSection === 'tabs') {
          const next = Math.max(0, tabIndex - 1)
          setTabIndex(next)
          setActiveTab(TABS[next].id)
          setContentIndex(0)
          if (contentPanelRef.current) contentPanelRef.current.scrollTop = 0
        } else {
          if (soundControl && contentIndex === 0) {
            setFocusSection('tabs')
            return
          }
          if (contentIndex === 0 && contentPanelRef.current && contentPanelRef.current.scrollTop > 0) {
            contentPanelRef.current.scrollTop -= contentPanelRef.current.clientHeight * 0.6
          } else setContentIndex(Math.max(0, contentIndex - 1))
        }
        return
      }

      if (key === 'ArrowDown' || code === 40 || code === 20) {
        e.preventDefault()
        if (focusSection === 'tabs') {
          const next = Math.min(TABS.length - 1, tabIndex + 1)
          setTabIndex(next)
          setActiveTab(TABS[next].id)
          setContentIndex(0)
          if (contentPanelRef.current) contentPanelRef.current.scrollTop = 0
        } else {
          const items = contentItems()
          const next = Math.min(Math.max(0, items.length - 1), contentIndex + 1)
          const panel = contentPanelRef.current
          if (contentIndex === items.length - 1 && panel && panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1) {
            panel.scrollTop += panel.clientHeight * 0.6
          } else setContentIndex(next)
        }
        return
      }

      if (key === 'ArrowRight' || code === 39 || code === 22) {
        e.preventDefault()
        if (focusSection === 'tabs') {
          if (contentItems().length) {
            setFocusSection('content')
            setContentIndex(0)
          }
        }
        return
      }

      if (key === 'ArrowLeft' || code === 37 || code === 21) {
        e.preventDefault()
        if (focusSection === 'content') {
          setFocusSection('tabs')
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusSection, tabIndex, contentIndex, onClose, soundVolume])

  if (!isOpen) return null

  const toggleSetting = (key: keyof LauncherSettings) => {
    const updated = { ...settings, [key]: !settings[key] }
    onUpdateSettings(updated)
    saveStoredSettings(updated)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="tv-menu-focus fixed inset-0 z-50 flex items-center justify-center p-[3.5vw] backdrop-blur-xl animate-in fade-in duration-200 text-white select-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        background: `radial-gradient(ellipse 90% 60% at 50% 10%, ${currentTheme.glow1}, transparent 75%), rgba(0, 0, 0, 0.88)`,
        // @ts-expect-error CSS variable
        '--tv-accent': currentTheme.accent,
        '--tv-accent-text': currentTheme.accentText,
        '--tv-glow': currentTheme.glow1,
      }}
    >
      <div
        className="relative flex h-[82vh] w-full max-w-5xl overflow-hidden rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.9)] border"
        style={{
          backgroundColor: currentTheme.bg || '#0a0a0f',
          borderColor: currentTheme.glassBorder || 'rgba(255, 255, 255, 0.15)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.85), 0 0 40px ${currentTheme.glow1}`,
        }}
      >
        {/* Left Side: System Categories Navigation */}
        <aside className="flex min-h-0 w-[35%] flex-col border-r border-white/10 bg-black/60 p-[2vw]">
          <div className="flex items-center gap-3 pb-5 border-b border-white/10">
            <div
              className="grid size-11 place-items-center rounded-2xl shadow-lg transition-colors"
              style={{
                backgroundColor: currentTheme.accent,
                color: currentTheme.accentText || '#ffffff',
                boxShadow: `0 4px 16px ${currentTheme.glow1}`,
              }}
            >
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 id="settings-title" className="text-[clamp(17px,1.25vw,23px)] font-bold tracking-tight text-white">
                Launcher Settings
              </h2>
              <p className="text-[clamp(11px,0.75vw,14px)] text-white/50">
                System & Device Preferences
              </p>
            </div>
          </div>

          {/* Categories List */}
          <nav aria-label="Settings Categories" className="no-scrollbar min-h-0 flex-1 overflow-y-auto flex flex-col gap-1.5 px-4 pt-5 pb-5">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon
              const isSelected = activeTab === tab.id
              const isFocused = focusSection === 'tabs' && tabIndex === idx

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[idx] = el
                  }}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setTabIndex(idx)
                    setFocusSection('tabs')
                    setContentIndex(0)
                    if (contentPanelRef.current) contentPanelRef.current.scrollTop = 0
                  }}
                  className={cn(
                    'flex shrink-0 items-center justify-between rounded-xl px-3.5 py-3 text-left text-[clamp(13px,0.9vw,17px)] font-semibold transition-all duration-200 outline-none backdrop-blur-md',
                    isFocused
                      ? 'scale-102 bg-white/20 text-white'
                      : isSelected
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                  style={
                    isFocused || isSelected
                      ? {
                          boxShadow: isFocused ? `0 0 20px ${currentTheme.glow1}` : undefined,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className="size-4 shrink-0 transition-colors"
                      style={isSelected || isFocused ? { color: currentTheme.accent } : undefined}
                    />
                    <div className="truncate">
                      <span className="block truncate text-white">{tab.label}</span>
                      <span className={cn('text-[10px] font-normal block truncate', isFocused ? 'text-white/80' : 'text-white/40')}>
                        {tab.summary}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 opacity-50 shrink-0 ml-1 transition-colors"
                    style={isSelected ? { color: currentTheme.accent } : undefined}
                  />
                </button>
              )
            })}
          </nav>

          {/* D-Pad Remote Legend */}
          <div className="mt-auto pt-4 border-t border-white/10 text-[clamp(10px,0.7vw,13px)] text-white/40">
            <span>▲ / ▼ Scroll · ► Options · [Back] Categories / Exit</span>
          </div>
        </aside>

        {/* Right Side: Options Panel */}
        <main
          onFocusCapture={(event) => {
            const index = contentItems().indexOf(event.target as HTMLButtonElement)
            if (index >= 0) {
              setFocusSection('content')
              setContentIndex(index)
            }
          }}
          className="flex min-h-0 min-w-0 flex-1 flex-col p-[2vw]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-[clamp(18px,1.4vw,26px)] font-bold text-white capitalize">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-[clamp(11px,0.8vw,15px)] text-white/60">
                {TABS.find((t) => t.id === activeTab)?.summary}
              </p>
            </div>
          </div>

          <div
            ref={contentPanelRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-8"
          >
          {/* Category 1: Display & Video */}
          {activeTab === 'display' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Ken Burns Cinematic Pan</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Subtly zooms hero slide backdrops for atmospheric theater motion.
                  </span>
                </div>
                <button
                  ref={(el) => {
                    contentRefs.current[0] = el
                  }}
                  type="button"
                  onClick={() => toggleSetting('kenBurns')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105 shadow-sm',
                    !settings.kenBurns && 'bg-white/10 text-white/60 hover:bg-white/20',
                  )}
                  style={
                    settings.kenBurns
                      ? {
                          backgroundColor: currentTheme.accent,
                          color: currentTheme.accentText || '#ffffff',
                          boxShadow: `0 4px 14px ${currentTheme.glow1}`,
                        }
                      : undefined
                  }
                >
                  {settings.kenBurns ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Secondary Live Wallpaper</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Plays Goku Black Super Saiyan Rosé animated video when browsing shelves.
                  </span>
                </div>
                <button
                  ref={(el) => {
                    contentRefs.current[1] = el
                  }}
                  type="button"
                  onClick={() => toggleSetting('liveWallpaper')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105 shadow-sm',
                    !settings.liveWallpaper && 'bg-white/10 text-white/60 hover:bg-white/20',
                  )}
                  style={
                    settings.liveWallpaper
                      ? {
                          backgroundColor: currentTheme.accent,
                          color: currentTheme.accentText || '#ffffff',
                          boxShadow: `0 4px 14px ${currentTheme.glow1}`,
                        }
                      : undefined
                  }
                >
                  {settings.liveWallpaper ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Current display mode</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Physical output mode reported by Android.
                  </span>
                </div>
                <span
                  className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-mono font-bold"
                  style={{ color: currentTheme.accent }}
                >
                  {display?.available && display.width && display.height && display.refreshRate
                    ? `${display.width} × ${display.height} · ${Number(display.refreshRate.toFixed(2))} Hz`
                    : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Supported HDR formats</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Reported display capabilities, not necessarily the active video format.
                  </span>
                </div>
                <span className="max-w-[50%] text-right text-xs font-semibold text-white/80">
                  {!display?.available ? 'Unavailable' : display.hdrTypes?.length ? display.hdrTypes.join(' · ') : 'None reported'}
                </span>
              </div>
              {onOpenDisplaySettings && (
                <button type="button" onClick={onOpenDisplaySettings} className="self-start rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
                  Open Android settings
                </button>
              )}
            </div>
          )}

          {/* Category 2: Launcher Preferences */}
          {activeTab === 'launcher' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Auto-Advance Featured Carousel</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Automatically rotates hero titles every 9 seconds when idle.
                  </span>
                </div>
                <button
                  ref={(el) => {
                    contentRefs.current[0] = el
                  }}
                  type="button"
                  onClick={() => toggleSetting('autoAdvanceHero')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105 shadow-sm',
                    !settings.autoAdvanceHero && 'bg-white/10 text-white/60 hover:bg-white/20',
                  )}
                  style={
                    settings.autoAdvanceHero
                      ? {
                          backgroundColor: currentTheme.accent,
                          color: currentTheme.accentText || '#ffffff',
                          boxShadow: `0 4px 14px ${currentTheme.glow1}`,
                        }
                      : undefined
                  }
                >
                  {settings.autoAdvanceHero ? 'Auto (9s)' : 'Manual'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Status Clock Format</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Choose between standard 12-hour and military 24-hour time.
                  </span>
                </div>
                <button
                  ref={(el) => {
                    contentRefs.current[1] = el
                  }}
                  type="button"
                  onClick={() => toggleSetting('clock24h')}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105"
                >
                  {settings.clock24h ? '24-Hour (14:30)' : '12-Hour (2:30 PM)'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div>
                  <span className="text-base font-bold text-white block">Header Live Weather</span>
                  <span className="text-xs text-white/60 block mt-0.5">
                    Display local temperature badge alongside the status clock.
                  </span>
                </div>
                <button
                  ref={(el) => {
                    contentRefs.current[2] = el
                  }}
                  type="button"
                  onClick={() => toggleSetting('showWeather')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105 shadow-sm',
                    !settings.showWeather && 'bg-white/10 text-white/60 hover:bg-white/20',
                  )}
                  style={
                    settings.showWeather
                      ? {
                          backgroundColor: currentTheme.accent,
                          color: currentTheme.accentText || '#ffffff',
                          boxShadow: `0 4px 14px ${currentTheme.glow1}`,
                        }
                      : undefined
                  }
                >
                  {settings.showWeather ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          )}

          {/* Category 3: Audio & Sound */}
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-5">
              <button type="button" data-launcher-sound="true" role="slider" aria-label="Launcher sounds"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={soundVolume}
                aria-valuetext={soundVolume === 0 ? 'Off' : `${soundVolume}%`}
                onClick={() => updateSoundVolume(soundVolume === 0 ? lastSoundVolume.current : 0)}
                className="w-full rounded-2xl bg-white/5 p-6 text-left outline-none transition-colors duration-150">
                <span className="flex items-center justify-between gap-5">
                  <span className="text-base font-semibold">Launcher sounds</span>
                  <span className="text-sm font-bold" style={{ color: currentTheme.accent }}>{soundVolume === 0 ? 'Off' : `${soundVolume}%`}</span>
                </span>
                <span className="mt-4 block h-1.5 overflow-hidden rounded-full bg-white/15">
                  <span className="block h-full rounded-full" style={{ width: `${soundVolume}%`, backgroundColor: currentTheme.accent }} />
                </span>
                <span className="mt-3 block text-xs text-white/55">Left / Right to adjust · Select to {soundVolume === 0 ? 'turn on' : 'mute'} · Up for categories</span>
              </button>
              {audioError && <p role="alert" className="text-sm text-red-300">{audioError}</p>}
              {onOpenSoundSettings && <button type="button" onClick={onOpenSoundSettings}
                className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-6 text-left outline-none transition-colors duration-150">
                <span><span className="block text-base font-semibold">Open Android audio settings</span>
                  <span className="mt-1 block text-xs text-white/55">Volume, sound output and surround formats</span></span>
                <ChevronRight className="size-5 shrink-0 text-white/55" aria-hidden="true" />
              </button>}
            </div>
          )}

          {/* Category 4: Apps & Storage */}
          {activeTab === 'apps' && (
            <div className="flex flex-col gap-3.5">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-white">Active Streaming Apps</span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: currentTheme.accent }}
                  >
                    {installedAppsCount} Apps Installed
                  </span>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  You can move apps, install new channels from Google Play Store, or pin them directly from My Apps menu.
                </p>
                <button
                  ref={(el) => {
                    contentRefs.current[0] = el
                  }}
                  type="button"
                  onClick={onResetApps}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all outline-none focus:ring-2 focus:ring-white focus:scale-105"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset App Row to Default</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-white">Internal 16GB eMMC Storage</span>
                  <span className="text-xs font-mono text-white/80">11.8 GB Free of 16.0 GB</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden mb-3">
                  <div
                    className="relative h-full overflow-hidden rounded-full transition-all"
                    style={{ width: '26%', boxShadow: '0 0 10px var(--tv-accent, #00f0ff)' }}
                  >
                    <FlowFill />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">Launcher Cache: 2.4 MB</span>
                  <button
                    ref={(el) => {
                      contentRefs.current[1] = el
                    }}
                    type="button"
                    onClick={() => setCacheCleared(true)}
                    className="rounded-md px-2 py-1 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-white"
                    style={{ color: currentTheme.accent }}
                  >
                    {cacheCleared ? 'Cache Cleared ✓' : 'Clear Temporary Cache'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category 5: Network & Account */}
          {activeTab === 'network' && (
            <div className="flex flex-col gap-3.5">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="grid size-10 place-items-center rounded-full text-white font-bold"
                    style={{
                      backgroundColor: currentTheme.accent,
                      color: currentTheme.accentText || '#ffffff',
                      boxShadow: `0 0 14px ${currentTheme.glow1}`,
                    }}
                  >
                    <User className="size-5" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-white block">Launcher profile</span>
                    <span className="text-xs text-white/50 block">{activeProfileName ?? 'No profile selected'}</span>
                  </div>
                </div>
                <button type="button" onClick={onSelectProfile} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white">
                  Select launcher profile
                </button>
                {onOpenAccountSettings && (
                  <button type="button" onClick={onOpenAccountSettings} className="ml-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white">
                    Google TV accounts
                  </button>
                )}
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Wifi className="size-4" style={{ color: currentTheme.accent }} />
                    <span className="text-base font-bold text-white">{network?.label ?? (native ? 'Checking connection' : 'Not available in browser')}</span>
                  </div>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: currentTheme.accent }}
                  >
                    {network ? (network.connected ? (network.internet ? 'Internet connected' : 'Connected · internet unverified') : 'Offline') : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                  <div>IP address: <span className="text-white font-mono">{network?.ipAddress ?? 'Unavailable'}</span></div>
                  <div>VPN: <span className="text-white font-medium">{network?.vpn ? 'Active' : 'Not detected'}</span></div>
                </div>
              </div>
              {onOpenWifiSettings && (
                <button
                  ref={(el) => {
                    contentRefs.current[0] = el
                  }}
                  type="button"
                  onClick={onOpenWifiSettings}
                  className="flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white outline-none transition-all hover:bg-white/20 focus:scale-105 focus:ring-2 focus:ring-white"
                >
                  <Wifi className="size-3.5" />
                  <span>Open Wi-Fi Settings</span>
                </button>
              )}
            </div>
          )}

          {/* Category 6: System & About */}
          {activeTab === 'system' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">Device Model</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">onn. 4K Plus Streaming Device</span>
                  <span className="text-white/60">Walmart Item #15557424949</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">SoC / Processor</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">Amlogic S905X5M</span>
                  <span className="text-white/60">Quad-core Cortex-A55 @ 2.5 GHz</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">Graphics / GPU</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">ARM Mali-G310 V2</span>
                  <span className="text-white/60">Hardware AV1 / HEVC Decoding</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">System RAM & ROM</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">2GB DDR4 · 16GB eMMC</span>
                  <span className="text-white/60">Widevine L1 DRM Certified</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">Operating System</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">Google TV (Android 14)</span>
                  <span className="text-white/60">Kernel 6.1.x</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="text-white/50 block font-mono text-[10px] uppercase">Launcher Version</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">v2.6.0 (Futuristic Edition)</span>
                  <span className="text-white/60">Theofficialhoody-dev / hxxdy</span>
                </div>
              </div>

              {onOpenSystemSettings && (
                <button
                  ref={(el) => {
                    contentRefs.current[0] = el
                  }}
                  type="button"
                  onClick={onOpenSystemSettings}
                  className="flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white outline-none transition-all hover:bg-white/20 focus:scale-105 focus:ring-2 focus:ring-white"
                >
                  <Sliders className="size-3.5" />
                  <span>Open Android System Settings</span>
                </button>
              )}
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5 border border-white/10 mt-1">
                <span className="text-xs text-white/70">System Software Status</span>
                <button
                  ref={(el) => {
                    contentRefs.current[1] = el
                  }}
                  type="button"
                  onClick={() => setUpdateChecked(true)}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white outline-none hover:bg-white/20 focus:ring-2 focus:ring-white transition-all"                >
                  <RefreshCw
                    className="size-3.5"
                    style={updateChecked ? { color: currentTheme.accent } : undefined}
                  />
                  <span>{updateChecked ? 'Up to date (Checked)' : 'Check for Updates'}</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}
