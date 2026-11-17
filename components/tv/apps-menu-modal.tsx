'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid2X2, Search, Trash2, X } from 'lucide-react'
import { services, type LauncherApp, type ServiceCategory, type ServiceId } from '@/lib/launcher-data'
import type { ThemeConfig } from '@/lib/theme-data'
import { cn } from '@/lib/utils'
import { ServiceLogo } from './service-logo'

export type AppsMenuModalProps = {
  isOpen: boolean
  onClose: () => void
  installedApps: ServiceId[]
  nativeApps: ReadonlyMap<string, LauncherApp>
  homeRowApps: ServiceId[]
  onLaunchApp: (id: ServiceId) => void
  onToggleHomeRow: (id: ServiceId) => void
  onInstallApp: (id: ServiceId) => void
  onUninstallApp: (id: ServiceId) => void
  onSearchPlayStore?: (query: string) => void
  onOpenPlayListing?: (pkg: string) => void
  initialTab?: 'installed' | 'store'
  initialRowEdit?: boolean
  currentTheme: ThemeConfig
  simulateInstall?: boolean
}

const CATEGORIES: ('All' | ServiceCategory)[] = [
  'All', 'Streaming', 'Live TV & News', 'Sports', 'Music & Audio', 'Gaming', 'Media & Tools',
]

export function AppsMenuModal({
  isOpen, onClose, installedApps, nativeApps, homeRowApps, onLaunchApp, onToggleHomeRow,
  onInstallApp, onUninstallApp, onSearchPlayStore, onOpenPlayListing, initialTab = 'installed', initialRowEdit = false,
  currentTheme, simulateInstall = true,
}: AppsMenuModalProps) {
  const [tab, setTab] = useState(initialTab)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | ServiceCategory>('All')
  const [deleteMode, setDeleteMode] = useState(false)
  const [rowEditMode, setRowEditMode] = useState(false)
  const [focusedId, setFocusedId] = useState<ServiceId | null>(null)
  const [playApps, setPlayApps] = useState<PlayApp[]>([])
  const [playStatus, setPlayStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const playCache = useRef(new Map<string, PlayApp[]>())
  const rootRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef<HTMLButtonElement>(null)
  const storeTabRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const rowEditRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const nativeAppsByPackage = useMemo(
    () => new Map(Array.from(nativeApps.values(), (app) => [app.pkg, app])),
    [nativeApps],
  )

  const apps = useMemo(() => {
    const source = tab === 'installed'
      ? installedApps.map((id) => services[id]).filter(Boolean)
      : Object.values(services).filter((app) => !app.native)
    const term = query.trim().toLowerCase()
    return source.filter((app) =>
      (category === 'All' || app.category === category) &&
      (!term || `${nativeApps.get(app.id)?.label ?? app.name} ${app.description} ${app.developer}`.toLowerCase().includes(term)),
    )
  }, [tab, installedApps, nativeApps, query, category])

  useEffect(() => {
    if (!isOpen) return
    setTab(initialTab)
    setQuery('')
    setCategory('All')
    setDeleteMode(false)
    setRowEditMode(initialRowEdit)
    setFocusedId(null)
    requestAnimationFrame(() => (initialRowEdit ? rootRef.current?.querySelector<HTMLButtonElement>('[data-app]:not(:disabled)') : initialTab === 'store' ? storeTabRef.current : tabRef.current)?.focus({ preventScroll: true }))
  }, [isOpen, initialTab, initialRowEdit])

  useEffect(() => {
    if (!isOpen || tab !== 'store' || simulateInstall) return
    const term = query.trim()
    const cached = playCache.current.get(term)
    if (cached) {
      setPlayApps(cached)
      setPlayStatus('ready')
      return
    }
    const controller = new AbortController()
    setPlayApps([])
    setPlayStatus('loading')
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/__play_search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Google Play returned ${response.status}`)
        const data: { apps: PlayApp[] } = await response.json()
        if (!Array.isArray(data.apps) || data.apps.length === 0) throw new Error('No Play listings returned')
        playCache.current.set(term, data.apps)
        setPlayApps(data.apps)
        setPlayStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        console.warn('Unable to load Google Play listings', error)
        setPlayStatus('error')
      }
    }, term ? 600 : 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [isOpen, tab, query, simulateInstall, retry])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, keyCode: code } = event
      const input = document.activeElement === searchRef.current
      if (input && (key === 'Backspace' || code === 8)) return
      if (['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key) || code === 4 || code === 27) {
        event.preventDefault()
        if (deleteMode) {
          setDeleteMode(false)
          requestAnimationFrame(() => deleteRef.current?.focus({ preventScroll: true }))
        } else if (rowEditMode) {
          setRowEditMode(false)
          requestAnimationFrame(() => rowEditRef.current?.focus({ preventScroll: true }))
        } else onClose()
        return
      }
      if (['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key) || code === 13 || code === 23 || code === 66) {
        if (input) {
          if (tab === 'store' && key === 'Enter' && onSearchPlayStore) {
            event.preventDefault()
            onSearchPlayStore(query.trim())
          }
          return
        }
        event.preventDefault()
        if (!event.repeat && document.activeElement instanceof HTMLButtonElement) document.activeElement.click()
        return
      }
      if ((key === 'ContextMenu' || key === 'm' || key === 'M' || code === 82) && tab === 'installed' && !deleteMode && focusedId) {
        event.preventDefault()
        onToggleHomeRow(focusedId)
        return
      }
      const direction = key === 'ArrowRight' || code === 39 || code === 22 ? 'right'
        : key === 'ArrowLeft' || code === 37 || code === 21 ? 'left'
        : key === 'ArrowDown' || code === 40 || code === 20 ? 'down'
        : key === 'ArrowUp' || code === 38 || code === 19 ? 'up' : null
      if (!direction) return
      if (input && (direction === 'left' || direction === 'right')) {
        const element = searchRef.current
        if (element && (direction === 'left' ? element.selectionStart !== 0 : element.selectionEnd !== element.value.length)) return
      }
      event.preventDefault()
      const root = rootRef.current
      const current = document.activeElement
      if (!root || !(current instanceof HTMLElement)) return
      const bounds = (element: HTMLElement) => {
        let x = 0, y = 0
        for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
          x += node.offsetLeft
          y += node.offsetTop
        }
        for (let node = element.parentElement; node; node = node.parentElement) {
          x -= node.scrollLeft
          y -= node.scrollTop
        }
        return { x, y, width: element.offsetWidth, height: element.offsetHeight }
      }
      const from = bounds(current)
      const fromX = from.x + from.width / 2
      const fromY = from.y + from.height / 2
      let best: HTMLElement | undefined
      let bestScore = Infinity
      for (const candidate of root.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')) {
        if (candidate === current || candidate.offsetParent === null) continue
        const to = bounds(candidate)
        const dx = to.x + to.width / 2 - fromX
        const dy = to.y + to.height / 2 - fromY
        const horizontal = direction === 'right' || direction === 'left'
        if (current.dataset.app && horizontal && (!candidate.dataset.app || Math.abs(dy) > from.height / 2)) continue
        const primary = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy
        if (primary <= 1) continue
        const cross = horizontal ? Math.abs(dy) : Math.abs(dx)
        const aligned = horizontal
          ? to.y < from.y + from.height && to.y + to.height > from.y
          : to.x < from.x + from.width && to.x + to.width > from.x
        const score = primary + cross * 2 + (aligned ? 0 : 10000)
        if (score < bestScore) { best = candidate; bestScore = score }
      }
      best?.focus({ preventScroll: true })
      best?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, deleteMode, rowEditMode, onClose, tab, query, onSearchPlayStore, focusedId, onToggleHomeRow])

  if (!isOpen) return null

  const selectTab = (next: 'installed' | 'store') => {
    setTab(next)
    setQuery('')
    setCategory('All')
    setDeleteMode(false)
    setRowEditMode(false)
    setFocusedId(null)
  }
  const selectedStyle = { backgroundColor: currentTheme.accent, color: currentTheme.accentText }
  const pill = 'shrink-0 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apps-menu-title"
      onFocusCapture={(event) => {
        const id = (event.target as HTMLElement).dataset.app
        setFocusedId(id || null)
      }}
      className="tv-menu-focus fixed inset-0 z-50 flex flex-col overflow-hidden px-[5vw] pt-[5vh] pb-[3vh] text-white select-none animate-in fade-in duration-200"
      style={{
        background: `radial-gradient(ellipse 75% 55% at 50% -10%, ${currentTheme.glow1}, transparent 75%), ${currentTheme.bg || '#050507'}`,
        // @ts-expect-error CSS variable
        '--tv-accent': currentTheme.accent,
        '--tv-glow': currentTheme.glow1,
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-6 pb-5">
        <div>
          <h2 id="apps-menu-title" className="text-[clamp(28px,2.4vw,44px)] font-bold tracking-tight">My Apps</h2>
          <p className="mt-1 text-sm text-white/55">{tab === 'installed' ? `${installedApps.length} installed apps` : 'Find more apps on Google Play'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close My Apps" className="grid size-11 place-items-center rounded-full bg-white/10"><X className="size-5" /></button>
      </header>

      <div className="flex shrink-0 items-center gap-3 py-4">
        <button ref={tabRef} type="button" onClick={() => selectTab('installed')} className={pill} style={tab === 'installed' ? selectedStyle : undefined}>Installed</button>
        <button ref={storeTabRef} type="button" onClick={() => selectTab('store')} className={pill} style={tab === 'store' ? selectedStyle : undefined}>Google Play</button>
        <div className="relative ml-auto w-[min(26vw,360px)]">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/60" />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'installed' ? 'Search installed apps' : 'Search Google Play'} aria-label={tab === 'installed' ? 'Search installed apps' : 'Search Google Play'} className="w-full rounded-full bg-white/10 py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/45" />
        </div>
        {tab === 'store' && onSearchPlayStore && <button type="button" onClick={() => onSearchPlayStore(query.trim())} className={pill}>Search Play</button>}
        {tab === 'installed' && <button ref={rowEditRef} type="button" onClick={() => {
          const next = !rowEditMode
          setRowEditMode(next)
          setDeleteMode(false)
          if (next) requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>('[data-app]:not(:disabled)')?.focus({ preventScroll: true }))
        }} className={pill} style={rowEditMode ? selectedStyle : undefined}>{rowEditMode ? 'Done editing row' : 'Edit Home row'}</button>}
        {tab === 'installed' && <button ref={deleteRef} type="button" onClick={() => {
          const next = !deleteMode
          setDeleteMode(next)
          setRowEditMode(false)
          if (next) requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>('[data-app]:not(:disabled)')?.focus({ preventScroll: true }))
        }} className={cn(pill, 'flex items-center gap-2')} style={deleteMode ? selectedStyle : undefined}><Trash2 className="size-4" />{deleteMode ? 'Done' : 'Delete apps'}</button>}
      </div>

      {(tab === 'installed' || simulateInstall) && <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-3 py-4">
        {CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className="shrink-0 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/75" style={category === item ? selectedStyle : undefined}>{item}</button>)}
      </div>}

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5">
        {tab === 'store' && !simulateInstall ? (
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold">{query.trim() ? 'Search results' : 'Discover apps'}</h3>
              <p className="mt-1 text-xs text-white/50">Google Play listings · Compatibility and availability are confirmed in Play Store</p>
            </div>
            {playStatus === 'loading' && <p className="py-10 text-sm text-white/60" role="status">Loading Google Play apps…</p>}
            {playStatus === 'error' && <div className="py-10">
              <p className="mb-4 text-sm text-white/70" role="alert">Could not load Google Play listings. You can retry or open Google Play.</p>
              <div className="flex gap-3">
                <button type="button" className={pill} onClick={() => setRetry((value) => value + 1)}>Retry</button>
                <button type="button" className={pill} onClick={() => onSearchPlayStore?.(query.trim())}>Open Google Play</button>
              </div>
            </div>}
            {playStatus === 'ready' && <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {playApps.map((app) => {
                const installed = nativeAppsByPackage.get(app.pkg)
                return <button key={app.pkg} data-app={app.pkg} type="button"
                aria-label={`View ${app.name} on Google Play`} onClick={() => onOpenPlayListing?.(app.pkg)}
                className="tv-app-tile group min-w-0 text-center">
                <div className="relative grid aspect-video w-full place-items-center">
                  <PlayAppIcon key={app.pkg} app={app} installed={installed} />
                </div>
                <span className="mt-3 block truncate px-1 text-xs font-medium text-white/60 group-focus:text-white/90">{app.name}</span>
              </button>})}
            </div>}
          </div>
        ) : <>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{deleteMode ? 'Choose an app to manage' : rowEditMode ? 'Choose apps for your Home row' : tab === 'installed' ? 'Your apps' : 'Suggested apps'}</h3>
          {deleteMode && <span className="text-sm text-white/55">Opens Android app settings</span>}
          {rowEditMode && <span className="text-sm text-white/55">Select to add or remove · Apps stay installed</span>}
        </div>
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/55"><Grid2X2 className="mb-4 size-10" /><p>No apps found</p>{tab === 'store' && onSearchPlayStore && <p className="mt-2 text-sm">Search Google Play for more apps.</p>}</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {apps.map((app) => {
              const isInstalled = installedApps.includes(app.id)
              const disabled = deleteMode && simulateInstall && app.isDefaultInstalled
              const nativeApp = nativeApps.get(app.id)
              const name = nativeApp?.label ?? app.name
              return (
                <button key={app.id} data-app={app.id} type="button" disabled={disabled}
                  aria-label={deleteMode ? `Manage ${name}` : rowEditMode ? `${homeRowApps.includes(app.id) ? 'Remove' : 'Add'} ${name} ${homeRowApps.includes(app.id) ? 'from' : 'to'} Home row` : `${tab === 'store' && !isInstalled ? 'Find' : 'Open'} ${name}`}
                  onClick={() => deleteMode ? onUninstallApp(app.id) : rowEditMode ? onToggleHomeRow(app.id) : tab === 'installed' || isInstalled ? onLaunchApp(app.id) : onInstallApp(app.id)}
                  className="tv-app-tile group min-w-0 text-center disabled:opacity-40">
                  <div className="relative grid aspect-video w-full place-items-center">
                    {nativeApp ? <NativeAppIcon key={nativeApp.icon} app={nativeApp} /> : !simulateInstall ? <Grid2X2 aria-hidden="true" className="tv-app-art size-12 text-white/40" /> : <ServiceLogo id={app.id} className={cn('tv-app-art', app.native ? 'size-full rounded-xl object-cover' : 'max-h-[45%] w-auto max-w-[75%]')} />}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 px-1">
                    <span className="truncate text-xs font-medium text-white/60 group-focus:text-white/90">{name}</span>
                    {tab === 'installed' && (rowEditMode || homeRowApps.includes(app.id)) && <span className="shrink-0 text-[10px] font-medium" style={{ color: homeRowApps.includes(app.id) ? currentTheme.accent : 'rgba(255,255,255,0.5)' }}>{homeRowApps.includes(app.id) ? 'On Home' : 'Not on Home'}</span>}
                    {tab === 'store' && isInstalled && <span className="shrink-0 text-[10px] font-medium text-white/50">Installed</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
        </>}
      </div>
      <footer className="shrink-0 pt-3 text-xs text-white/45">{deleteMode ? 'Select an app · Back to finish' : rowEditMode ? 'Select to add or remove from Home · Back to finish' : tab === 'installed' ? 'Select to open · Edit Home row to choose apps · Back to exit' : 'Search Google Play · Back to exit'}</footer>
    </div>
  )
}

type PlayApp = { pkg: string; name: string; icon: string; artwork?: string | null }

function PlayAppIcon({ app, installed }: { app: PlayApp; installed?: LauncherApp }) {
  const [artFailed, setArtFailed] = useState(false)
  const [failed, setFailed] = useState(false)
  if (app.artwork && !artFailed) return (
    // eslint-disable-next-line @next/next/no-img-element -- artwork comes directly from Google Play.
    <img src={app.artwork} alt="" aria-hidden="true" loading="lazy" decoding="async"
      onError={() => setArtFailed(true)} className="tv-app-art size-full rounded-xl object-cover" />
  )
  if (installed) return <NativeAppIcon app={installed} />
  return (
    <>
      {failed ? <Grid2X2 aria-hidden="true" className="size-12 text-white/40" /> :
        // eslint-disable-next-line @next/next/no-img-element -- artwork comes directly from Google Play.
        <img src={app.icon.replace(/=s64$/, '=s256')} alt="" aria-hidden="true" loading="lazy"
          onError={() => setFailed(true)} className="tv-app-art h-[67%] w-auto max-w-[75%] rounded-xl object-contain" />}
    </>
  )
}

function NativeAppIcon({ app }: { app: LauncherApp }) {
  const [failed, setFailed] = useState(false)
  if (!app.icon || failed) return <Grid2X2 aria-hidden="true" className="tv-app-art size-12 text-white/40" />
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Android supplies each installed app's banner.
    <img src={app.icon} alt="" aria-hidden="true" draggable={false} loading="lazy"
      onError={() => setFailed(true)} className="tv-app-art size-full rounded-xl object-cover" />
  )
}
