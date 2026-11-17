'use client'

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import {
  continueWatching as demoContinue,
  heroSlides as demoHero,
  installedApps,
  PLAY_PACKAGES,
  registerNativeApps,
  services,
  type ContinueItem,
  type HeroSlide,
  type LauncherApp,
  type NavItemId,
  type ServiceId,
} from '@/lib/launcher-data'
import {
  getNetwork,
  hasWatchNextAccess,
  isNative,
  launchApp,
  launchIntent,
  loadApps,
  loadContinueWatching,
  openAppInfo,
  openSystem,
  requestWatchNextAccess,
  type NetworkInfo,
} from '@/lib/native-bridge'
import { NUVIO_PACKAGE, nuvioFeaturedSlides, refreshTrendingSlides } from '@/lib/nuvio-featured'
import { getNavigationSoundVolume, playNavigationSound } from '@/lib/navigation-sounds'
import {
  BUILT_IN_THEMES,
  deleteCustomThemeFromStorage,
  getCustomThemes,
  getStoredThemeId,
  saveCustomThemeToStorage,
  setStoredThemeId,
  type ThemeConfig,
} from '@/lib/theme-data'
import { TopHeader } from './top-header'
import { HeroBackdrop } from './hero-backdrop'
import { HeroInfo } from './hero-info'
import { ContinueWatchingRow } from './continue-watching-row'
import { AppsRow } from './apps-row'
import { LaunchOverlay, type LaunchState } from './launch-overlay'
import { ThemeModal } from './theme-modal'
import { ThemeCreator } from './theme-creator'
import { ProfileModal } from './profile-modal'
import { AppsMenuModal } from './apps-menu-modal'
import { SurfsharkModal } from './surfshark-modal'
import { DEFAULT_SETTINGS, getStoredSettings, saveStoredSettings, SettingsModal, type LauncherSettings } from './settings-modal'
import { createProfile, loadProfiles, saveProfiles, type Profile } from '@/lib/profiles'
type Zone = 'nav' | 'hero' | 'continue' | 'appsControls' | 'apps'

const ZONES: Zone[] = ['nav', 'hero', 'continue', 'appsControls', 'apps']
const SLIDE_MS = 9000
const LAUNCH_MS = 2200
const LONG_PRESS_MS = 650
const LAUNCH_DELAY_MS = 300
const SURFSHARK_PACKAGE = 'com.surfshark.vpnclient.android'
const YOUTUBE_PACKAGE = 'com.google.android.youtube.tv'
const SMARTTUBE_PACKAGES = ['org.smarttube.stable', 'org.smarttube.beta']
const isYouTubeItem = (item: ContinueItem) => item.pkg === YOUTUBE_PACKAGE || SMARTTUBE_PACKAGES.includes(item.pkg ?? '') || item.service === 'youtube'
const ORDER_KEY = 'tv_launcher_apps_order'
const HIDDEN_KEY = 'tv_launcher_apps_hidden'

const idOf = (app: LauncherApp): string => app.service ?? app.pkg

function readList(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeList(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

type NavItem = { id: NavItemId; label: string }

type LauncherData = {
  native: boolean
  apps: LauncherApp[]
  continueItems: ContinueItem[]
  slides: HeroSlide[]
  nav: NavItem[]
  network: NetworkInfo
}

const demoNav: NavItem[] = [
  { id: 'profile', label: 'Me' },
  { id: 'theme', label: 'Theme' },
  { id: 'network', label: 'Wi-Fi · Home-5G' },
  { id: 'settings', label: 'Settings' },
  { id: 'apps', label: 'My Apps' },
]

const demoData: LauncherData = {
  native: false,
  apps: installedApps.map((id) => ({ pkg: id, label: services[id].name, icon: services[id].logo, service: id })),
  continueItems: demoContinue,
  slides: demoHero,
  nav: demoNav,
  network: { connected: true, label: 'Wi-Fi · Home-5G' },
}

const emptyData: LauncherData = { ...demoData, apps: [], continueItems: [], slides: [] }

/** Resume via the app's own intent, falling back to simply opening the app. */
function openItem(intentUri?: string, pkg?: string): boolean {
  if (intentUri && launchIntent(intentUri)) return true
  return pkg ? launchApp(pkg) : false
}

function loadLauncherData(): LauncherData {
  if (!isNative()) return demoData
  const apps = loadApps()
  registerNativeApps(apps)
  const network = getNetwork()
  return {
    native: true,
    apps,
    continueItems: loadContinueWatching(),
    // The hero only features popular movies and shows, sourced the same way Nuvio does.
    slides: apps.some((app) => app.pkg === NUVIO_PACKAGE) ? nuvioFeaturedSlides() : [],
    nav: [
      { id: 'profile', label: 'Profile' },
      { id: 'theme', label: 'Theme' },
      { id: 'network', label: network.label },
      ...(apps.some((app) => app.pkg === SURFSHARK_PACKAGE) ? [{ id: 'surfshark' as const, label: 'Surfshark VPN' }] : []),
      { id: 'settings', label: 'Settings' },
      { id: 'apps', label: 'My Apps' },
    ],
    network,
  }
}

function retainUnchangedItems<T>(previous: T[], next: T[], key: (item: T) => string): T[] {
  const existing = new Map(previous.map((item) => [key(item), item]))
  const result = next.map((item) => {
    const old = existing.get(key(item))
    return old && JSON.stringify(old) === JSON.stringify(item) ? old : item
  })
  return result.length === previous.length && result.every((item, index) => item === previous[index]) ? previous : result
}

/** Where each shelf's top edge should rest, as a fraction of viewport height, when focused. */
const shelfAnchor = { continue: 0.17, apps: 0.52 } as const

export function TvLauncher() {
  // Real data is only known on the client (the Android shell injects its bridge), so render nothing until then.
  const [data, setData] = useState<LauncherData>(emptyData)
  const [ready, setReady] = useState(false)
  const { apps, slides: heroSlides, nav: navItems } = data

  // Settings, home-row order and hidden apps are client-only state, loaded in the init effect.
  const [settings, setSettings] = useState<LauncherSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false)
  const [isSurfsharkOpen, setIsSurfsharkOpen] = useState(false)
  const [appsMenuTab, setAppsMenuTab] = useState<'installed' | 'store'>('installed')
  const [appsMenuRowEdit, setAppsMenuRowEdit] = useState(false)
  const [organize, setOrganize] = useState(false)
  const [movingApp, setMovingApp] = useState(false)
  const [order, setOrder] = useState<string[]>([])
  const [hidden, setHidden] = useState<string[]>([])
  const [demoAdded, setDemoAdded] = useState<string[]>([])
  const [demoRemoved, setDemoRemoved] = useState<string[]>([])

  const [zone, setZone] = useState<Zone>('hero')
  const [indices, setIndices] = useState<Record<Zone, number>>({ nav: 0, hero: 0, continue: 0, appsControls: 0, apps: 0 })
  const [slide, setSlide] = useState(0)
  const [launch, setLaunch] = useState<LaunchState | null>(null)
  const [docHidden, setDocHidden] = useState(false)
  const launchRef = useRef<LaunchState | null>(null)
  const launchTimerRef = useRef<number | undefined>(undefined)
  const [notice, setNotice] = useState<{ key: number; text: string } | null>(null)

  // Theme Management
  const [themeId, setThemeId] = useState<string>(BUILT_IN_THEMES[0].id)
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([])
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileId] = useState('')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId)
  const hiddenKey = activeProfile?.hidden.join('|') ?? ''
  const visibleContinueItems = useMemo(
    () => data.continueItems.filter((item) => !hiddenKey.split('|').includes(item.id)),
    [data.continueItems, hiddenKey],
  )
  const continueItems = useMemo(() => visibleContinueItems.filter((item) => !isYouTubeItem(item)).slice(0, 20), [visibleContinueItems])
  const allThemes = useMemo(() => [...BUILT_IN_THEMES, ...customThemes], [customThemes])
  const currentTheme = allThemes.find((t) => t.id === themeId) || BUILT_IN_THEMES[0]

  useEffect(() => {
    if (!ready || isThemeModalOpen || isCreateModalOpen) return
    const root = document.querySelector('main')
    if (!root) return
    root.style.setProperty('--tv-bg', currentTheme.bg)
    root.style.setProperty('--tv-accent', currentTheme.accent)
    root.style.setProperty('--tv-accent-text', currentTheme.accentText)
    root.style.setProperty('--tv-glow', currentTheme.glow1)
    root.style.setProperty('--tv-glow-2', currentTheme.glow2)
    root.style.setProperty('--tv-glass', currentTheme.glassBg)
    root.style.setProperty('--tv-glass-border', currentTheme.glassBorder)
  }, [ready, isThemeModalOpen, isCreateModalOpen, currentTheme])

  const persistActiveProfileTheme = (nextThemeId: string) => {
    const updated = profiles.map((profile) =>
      profile.id === activeProfileId ? { ...profile, themeId: nextThemeId } : profile,
    )
    setProfiles(updated)
    saveProfiles(updated, activeProfileId)
  }

  const handleSelectTheme = (theme: ThemeConfig) => {
    setThemeId(theme.id)
    setStoredThemeId(theme.id)
    persistActiveProfileTheme(theme.id)
    setNotice({ key: Date.now(), text: `Theme · ${theme.name}` })
  }

  const handleSaveCustomTheme = (newTheme: ThemeConfig) => {
    const updated = saveCustomThemeToStorage(newTheme)
    setCustomThemes(updated)
    setThemeId(newTheme.id)
    setStoredThemeId(newTheme.id)
    persistActiveProfileTheme(newTheme.id)
    setIsCreateModalOpen(false)
    setIsThemeModalOpen(false)
    setNotice({ key: Date.now(), text: `Custom theme applied · ${newTheme.name}` })
  }

  const handleDeleteCustomTheme = (id: string) => {
    const updated = deleteCustomThemeFromStorage(id)
    setCustomThemes(updated)
    const updatedProfiles = profiles.map((profile) =>
      profile.themeId === id ? { ...profile, themeId: BUILT_IN_THEMES[0].id } : profile,
    )
    if (updatedProfiles.some((profile, index) => profile !== profiles[index])) {
      setProfiles(updatedProfiles)
      saveProfiles(updatedProfiles, activeProfileId)
    }
    if (themeId === id) {
      setThemeId(BUILT_IN_THEMES[0].id)
      setStoredThemeId(BUILT_IN_THEMES[0].id)
    }
    setNotice({ key: Date.now(), text: 'Custom theme removed' })
  }

  const handleSwitchProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return
    setActiveProfileId(id)
    saveProfiles(profiles, id)
    setThemeId(profile.themeId)
    setStoredThemeId(profile.themeId)
  }

  const handleAddProfile = () => {
    const newProfile = createProfile(`Profile ${profiles.length + 1}`, profiles.length, themeId)
    const updated = [...profiles, newProfile]
    setProfiles(updated)
    setActiveProfileId(newProfile.id)
    setThemeId(newProfile.themeId)
    setStoredThemeId(newProfile.themeId)
    saveProfiles(updated, newProfile.id)
  }

  const handleRenameProfile = (id: string, name: string) => {
    const updated = profiles.map((p) => (p.id === id ? { ...p, name } : p))
    setProfiles(updated)
    saveProfiles(updated, activeProfileId)
  }

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return
    const updated = profiles.filter((p) => p.id !== id)
    const nextActive = activeProfileId === id ? updated[0]?.id ?? '' : activeProfileId
    setProfiles(updated)
    if (activeProfileId === id) {
      setActiveProfileId(nextActive)
      const nextProfile = updated.find((p) => p.id === nextActive)
      if (nextProfile) {
        setThemeId(nextProfile.themeId)
        setStoredThemeId(nextProfile.themeId)
      }
    }
    saveProfiles(updated, nextActive || activeProfileId)
  }

  const handleRestoreProfileHidden = (id: string) => {
    const updated = profiles.map((p) => (p.id === id ? { ...p, hidden: [] } : p))
    setProfiles(updated)
    saveProfiles(updated, activeProfileId)
  }

  const handleHideContinueItem = (id: string) => {
    const updated = profiles.map((profile) =>
      profile.id === activeProfileId && !profile.hidden.includes(id)
        ? { ...profile, hidden: [...profile.hidden, id] }
        : profile,
    )
    setProfiles(updated)
    saveProfiles(updated, activeProfileId)
    setIndices((prev) => ({ ...prev, continue: Math.max(0, prev.continue - 1) }))
    setNotice({ key: Date.now(), text: 'Removed from this profile’s Continue Watching' })
  }

  const appById = useMemo(() => {
    const map = new Map<string, LauncherApp>()
    for (const app of apps) if (!map.has(idOf(app))) map.set(idOf(app), app)
    return map
  }, [apps])
  const installedIds = useMemo(() => {
    const base = [...appById.keys()].filter((id) => !demoRemoved.includes(id))
    return [...base, ...demoAdded.filter((id) => !base.includes(id))]
  }, [appById, demoAdded, demoRemoved])
  const appsList = useMemo(() => {
    const visible = installedIds.filter((id) => !hidden.includes(id))
    const ordered = order.filter((id) => visible.includes(id))
    return [...ordered, ...visible.filter((id) => !ordered.includes(id))]
  }, [installedIds, hidden, order])
  const hiddenCount = installedIds.filter((id) => hidden.includes(id)).length
  const appInfo = useCallback(
    (id: string) => {
      const app = appById.get(id)
      const service = services[id]
      return {
        pkg: app?.pkg,
        name: app?.label ?? service?.name ?? id,
        icon: app?.icon ?? service?.logo,
        service: app?.service ?? (service && !service.native ? id : undefined),
      }
    },
    [appById],
  )

  const itemRefs = useRef<Record<Zone, (HTMLElement | null)[]>>({ nav: [], hero: [], continue: [], appsControls: [], apps: [] })
  const pressRef = useRef<{ handled: boolean; zone: Zone; index: number } | null>(null)
  const pressTimerRef = useRef<number | undefined>(undefined)
  const pointerReadyRef = useRef(true)
  const stackRef = useRef<HTMLDivElement>(null)
  const continueSectionRef = useRef<HTMLElement>(null)
  const appsSectionRef = useRef<HTMLElement>(null)
  const continueShelfRef = useRef<HTMLUListElement>(null)
  const appsShelfRef = useRef<HTMLUListElement>(null)

  const register = useCallback(
    (z: Zone) => (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[z][index] = el
    },
    [],
  )

  const focusItem = useCallback((z: Zone, index: number) => {
    setZone(z)
    setIndices((prev) => (prev[z] === index ? prev : { ...prev, [z]: index }))
  }, [])

  const changeSlide = useCallback(
    (delta: number) => {
      if (!heroSlides.length) return
      setSlide((s) => (s + delta + heroSlides.length) % heroSlides.length)
    },
    [heroSlides.length],
  )

  const startLaunch = useCallback((open: () => boolean, state: Omit<LaunchState, 'key'>) => {
    const next = { key: Date.now(), ...state }
    launchRef.current = next
    setLaunch(next)
    window.clearTimeout(launchTimerRef.current)
    launchTimerRef.current = window.setTimeout(() => {
      if (!open()) {
        launchRef.current = null
        setLaunch(null)
        setNotice({ key: Date.now(), text: `Couldn't open ${state.name}` })
      }
    }, LAUNCH_DELAY_MS)
  }, [])

  const moveApp = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= appsList.length || from === to) return
      const next = [...appsList]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      setOrder(next)
      writeList(ORDER_KEY, next)
      focusItem('apps', to)
      setNotice({ key: Date.now(), text: `${appInfo(moved).name} · position ${to + 1} of ${next.length}` })
    },
    [appInfo, appsList, focusItem],
  )

  const resetApps = useCallback(() => {
    setOrder([])
    setHidden([])
    writeList(ORDER_KEY, [])
    writeList(HIDDEN_KEY, [])
    setOrganize(false)
    setMovingApp(false)
    setNotice({ key: Date.now(), text: 'Home row reset' })
  }, [])

  const toggleHomeRow = useCallback(
    (id: ServiceId) => {
      const adding = hidden.includes(id)
      const next = adding ? hidden.filter((h) => h !== id) : [...hidden, id]
      setHidden(next)
      writeList(HIDDEN_KEY, next)
      setNotice({ key: Date.now(), text: `${appInfo(id).name} ${adding ? 'added to' : 'removed from'} Home row` })
    },
    [appInfo, hidden],
  )

  const launchById = useCallback(
    (id: ServiceId) => {
      const info = appInfo(id)
      startLaunch(() => data.native ? Boolean(info.pkg && launchApp(info.pkg)) : true, { name: info.name, service: info.service, icon: info.icon, action: `Opening ${info.name}` })
    },
    [appInfo, data.native, startLaunch],
  )

  const installApp = useCallback(
    (id: ServiceId) => {
      if (data.native) {
        const pkg = PLAY_PACKAGES[id]
        const ok = pkg ? launchIntent(`intent://details?id=${pkg}#Intent;scheme=market;package=com.android.vending;end`) : false
        if (!ok) setNotice({ key: Date.now(), text: `Couldn't open the Play Store for ${services[id]?.name ?? id}` })
        return
      }
      setDemoAdded((prev) => (prev.includes(id) ? prev : [...prev, id]))
      setDemoRemoved((prev) => prev.filter((r) => r !== id))
    },
    [data.native],
  )

  const uninstallApp = useCallback(
    (id: ServiceId) => {
      if (data.native) {
        const pkg = appById.get(id)?.pkg
        if (!pkg || !openAppInfo(pkg)) setNotice({ key: Date.now(), text: 'Could not open app uninstall settings' })
        return
      }
      setDemoRemoved((prev) => (prev.includes(id) ? prev : [...prev, id]))
      setDemoAdded((prev) => prev.filter((a) => a !== id))
    },
    [appById, data.native],
  )

  const openAppsMenu = useCallback((tab: 'installed' | 'store' = 'installed') => {
    setAppsMenuTab(tab)
    setAppsMenuRowEdit(false)
    setIsAppsMenuOpen(true)
  }, [])
  const openRowEditor = useCallback(() => {
    setMovingApp(false)
    setAppsMenuTab('installed')
    setAppsMenuRowEdit(true)
    setIsAppsMenuOpen(true)
  }, [])

  const updateSettings = useCallback((next: LauncherSettings) => {
    setSettings(next)
    saveStoredSettings(next)
  }, [])

  const activate = useCallback(
    (z: Zone, index: number) => {
      if (z === 'nav') {
        const item = navItems[index]
        if (!item) return
        if (item.id === 'apps') {
          openAppsMenu()
        } else if (item.id === 'theme') {
          setIsThemeModalOpen(true)
        } else if (item.id === 'profile') {
          setIsProfileModalOpen(true)
        } else if (item.id === 'settings') {
          setIsSettingsOpen(true)
        } else if (item.id === 'surfshark') {
          setIsSurfsharkOpen(true)
        } else if (data.native) {
          openSystem('network')
        } else {
          setNotice({ key: Date.now(), text: 'Connected to Home-5G · 940 Mbps' })
        }
        return
      }
      if (z === 'hero') {
        const s = heroSlides[slide]
        if (!s) return
        startLaunch(() => data.native ? openItem(s.intentUri, s.pkg) : true, {
          name: s.appName ?? s.title,
          service: s.service,
          icon: s.appIcon,
          action: `Playing ${s.title}`,
        })
        return
      }
      if (z === 'continue') {
        const item = continueItems[index]
        if (!item) return
        startLaunch(() => data.native ? openItem(item.intentUri, item.pkg) : true, {
          name: item.appName ?? item.title,
          service: item.service,
          icon: item.appIcon,
          action: `${item.historyOnly ? 'Playing' : 'Resuming'} ${item.title}`,
        })
        return
      }
      if (z === 'appsControls') {
        if (!organize) {
          setOrganize(true)
          setMovingApp(false)
          focusItem('apps', Math.min(indices.apps, Math.max(0, appsList.length - 1)))
        } else if (index === 0) {
          openRowEditor()
        } else if (index === 1) {
          resetApps()
        } else {
          setOrganize(false)
          setMovingApp(false)
          focusItem('apps', indices.apps)
        }
        return
      }
      if (index >= appsList.length) {
        openAppsMenu()
        return
      }
      const id = appsList[index]
      if (!organize) launchById(id)
      else setMovingApp((moving) => !moving)
    },
    [apps, appsList, continueItems, data.native, focusItem, heroSlides, indices.apps, launchById, navItems, openAppsMenu, openRowEditor, organize, resetApps, slide, startLaunch],
  )

  const activateRef = useRef(activate)
  useEffect(() => {
    activateRef.current = activate
  })
  const registerContinue = useMemo(() => register('continue'), [register])
  const registerApps = useMemo(() => register('apps'), [register])
  const hoverContinue = useCallback((i: number) => {
    if (pointerReadyRef.current) focusItem('continue', i)
  }, [focusItem])
  const hoverApps = useCallback((i: number) => {
    if (pointerReadyRef.current) focusItem('apps', i)
  }, [focusItem])
  const activateContinue = useCallback((i: number) => activateRef.current('continue', i), [])
  const activateApps = useCallback((i: number) => activateRef.current('apps', i), [])

  const zoneCounts: Record<Zone, number> = {
    nav: navItems.length,
    hero: heroSlides.length ? 1 : 0,
    continue: continueItems.length,
    appsControls: organize ? 3 : 1,
    apps: appsList.length + 1,
  }
  const activeZones = ZONES.filter((z) => zoneCounts[z] > 0)
  // Where Back/Home returns to: the hero when there is one, otherwise the first shelf.
  const homeZone: Zone = heroSlides.length ? 'hero' : continueItems.length ? 'continue' : 'apps'

  const modalOpen = isThemeModalOpen || isCreateModalOpen || isProfileModalOpen || isSettingsOpen || isAppsMenuOpen || isSurfsharkOpen

  const triggerLongPress = useEffectEvent(() => {
    const press = pressRef.current
    window.clearTimeout(pressTimerRef.current)
    if (!press || press.handled) return
    const pkg = press.zone === 'apps' && !organize ? appInfo(appsList[press.index] ?? '').pkg : undefined
    if (data.native && pkg) {
      press.handled = true
      openAppInfo(pkg)
    }
  })

  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'LauncherSettings') {
      event.preventDefault()
      setIsThemeModalOpen(false)
      setIsCreateModalOpen(false)
      setIsProfileModalOpen(false)
      setIsAppsMenuOpen(false)
      setIsSurfsharkOpen(false)
      setIsSettingsOpen(true)
      return
    }
    // Modals manage their own remote input.
    if (modalOpen) return

    const key = event.key
    const code = event.keyCode
    pointerReadyRef.current = false
    const isSelect = ['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key) || code === 13 || code === 23 || code === 66
    const isBack = ['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key) || code === 27 || code === 8 || code === 4

    if (launch) {
      if (isBack || isSelect) {
        event.preventDefault()
        window.clearTimeout(launchTimerRef.current)
        launchRef.current = null
        setLaunch(null)
      }
      return
    }

    const isPlay =
      ['MediaPlayPause', 'Play', 'MediaPlay', 'MediaPause'].includes(key) || code === 179 || code === 85 || code === 126 || code === 127
    if (isPlay) {
      event.preventDefault()
      activate(zone, indices[zone])
      return
    }

    // Media next / previous step through the hero slides on TV remotes.
    if (code === 87 || key === 'MediaTrackNext') {
      event.preventDefault()
      changeSlide(1)
      return
    }
    if (code === 88 || key === 'MediaTrackPrevious') {
      event.preventDefault()
      changeSlide(-1)
      return
    }

    if (key === 't' || key === 'T') {
      event.preventDefault()
      setIsThemeModalOpen(true)
      return
    }
    if (key === 's' || key === 'S') {
      event.preventDefault()
      setIsSettingsOpen(true)
      return
    }
    if (key === 'a' || key === 'A') {
      event.preventDefault()
      openAppsMenu()
      return
    }

    const zoneIndex = activeZones.indexOf(zone)
    const isUp = key === 'ArrowUp' || code === 38 || code === 19
    const isDown = key === 'ArrowDown' || code === 40 || code === 20
    const isLeft = key === 'ArrowLeft' || code === 37 || code === 21
    const isRight = key === 'ArrowRight' || code === 39 || code === 22
    if (isUp || isDown) {
      event.preventDefault()
      if (movingApp) return
      const step = isUp ? -1 : 1
      setZone(activeZones[Math.min(activeZones.length - 1, Math.max(0, zoneIndex + step))])
    } else if (isLeft || isRight) {
      event.preventDefault()
      const delta = isLeft ? -1 : 1
      if (zone === 'hero') changeSlide(delta)
      else if (zone === 'apps' && organize && movingApp) moveApp(indices.apps, indices.apps + delta)
      else focusItem(zone, Math.min(zoneCounts[zone] - 1, Math.max(0, indices[zone] + delta)))
    } else if (isSelect) {
      event.preventDefault()
      // Activation happens on key-up so a long press can open app info instead of launching.
      // A second key-down before key-up means the key is held (the WebView doesn't always flag `repeat`).
      if (pressRef.current) {
        triggerLongPress()
      } else {
        pressRef.current = { handled: false, zone, index: indices[zone] }
        pressTimerRef.current = window.setTimeout(triggerLongPress, LONG_PRESS_MS)
      }
    } else if (key === 'ContextMenu' || key === 'i' || key === 'I') {
      // Menu opens system info for apps and hides Continue Watching items for this profile.
      if (zone === 'apps') {
        // Menu toggles organize mode: Left/Right reorder, Back exits.
        event.preventDefault()
        if (indices.apps < appsList.length) {
          setOrganize((on) => !on)
          setMovingApp(false)
        }
      } else if (zone === 'continue' && continueItems[indices.continue]) {
        event.preventDefault()
        handleHideContinueItem(continueItems[indices.continue].id)
      }
    } else if (isBack) {
      event.preventDefault()
      if (movingApp) setMovingApp(false)
      else if (organize) setOrganize(false)
      // Back dismisses a mode, but does not unexpectedly move the user's focus.
    }
  })

  const handleKeyUp = useEffectEvent((event: KeyboardEvent) => {
    const isSelect = ['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(event.key) || event.keyCode === 23 || event.keyCode === 66
    if (!isSelect) return
    const press = pressRef.current
    pressRef.current = null
    window.clearTimeout(pressTimerRef.current)
    if (!press || press.handled || launch || modalOpen) return
    event.preventDefault()
    activate(press.zone, press.index)
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKey(event)
    const onKeyUp = (event: KeyboardEvent) => handleKeyUp(event)
    const onPointerMove = (event: MouseEvent) => {
      if (event.movementX || event.movementY) pointerReadyRef.current = true
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onPointerMove)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onPointerMove)
    }
  }, [])

  useEffect(() => {
    let volume = getNavigationSoundVolume()
    const update = () => { volume = getNavigationSoundVolume() }
    const sound = (event: KeyboardEvent) => {
      if (event.repeat || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const key = event.key
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) playNavigationSound('move', volume)
      else if (['Enter', ' ', 'Select', 'Ok', 'MediaSelect'].includes(key)) playNavigationSound('select', volume)
      else if (['Escape', 'Backspace', 'Back', 'GoBack', 'BrowserBack'].includes(key)) playNavigationSound('back', volume)
    }
    window.addEventListener('keydown', sound)
    window.addEventListener('launcher:sound-volume', update)
    return () => { window.removeEventListener('keydown', sound); window.removeEventListener('launcher:sound-volume', update) }
  }, [])

  const refreshData = useEffectEvent(() => {
    const next = { ...loadLauncherData() }
    next.apps = retainUnchangedItems(data.apps, next.apps, (item) => item.pkg)
    next.continueItems = retainUnchangedItems(data.continueItems, next.continueItems, (item) => item.id)
    next.slides = retainUnchangedItems(data.slides, next.slides, (item) => item.id)
    const focusedContinueId = continueItems[indices.continue]?.id
    const nextContinueItems = next.continueItems.filter((item) => !isYouTubeItem(item) && !hiddenKey.split('|').includes(item.id)).slice(0, 20)
    const focusedContinueIndex = nextContinueItems.findIndex((item) => item.id === focusedContinueId)
    setData((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    setIndices((prev) => ({
      nav: Math.min(prev.nav, Math.max(0, next.nav.length - 1)),
      hero: prev.hero,
      continue: focusedContinueIndex >= 0 ? focusedContinueIndex : Math.min(prev.continue, Math.max(0, nextContinueItems.length - 1)),
      appsControls: prev.appsControls,
      apps: Math.min(prev.apps, Math.max(0, next.apps.length)),
    }))
    setSlide((s) => (s < next.slides.length ? s : 0))
    return next
  })

  // Initial load, then refresh when the shell reports installs/removals, new Watch Next data, or a Home press.
  useEffect(() => {
    setCustomThemes(getCustomThemes())
    setSettings(getStoredSettings())
    setOrder(readList(ORDER_KEY))
    setHidden(readList(HIDDEN_KEY))
    const storedThemeId = getStoredThemeId()
    setThemeId(storedThemeId)
    const { profiles: loadedProfiles, activeId: loadedActiveId } = loadProfiles(storedThemeId)
    setProfiles(loadedProfiles)
    setActiveProfileId(loadedActiveId)
    const activeProfile = loadedProfiles.find((p) => p.id === loadedActiveId)
    if (activeProfile) {
      setThemeId(activeProfile.themeId)
      setStoredThemeId(activeProfile.themeId)
    }
    const initial = refreshData()
    setZone(initial.slides.length ? 'hero' : initial.continueItems.length ? 'continue' : 'apps')
    setReady(true)
    if (isNative()) {
      if (!hasWatchNextAccess()) requestWatchNextAccess()
      refreshTrendingSlides().then((changed) => {
        if (changed) refreshData()
      })
    }
    // WebView timers freeze while another app is in front, so the launch overlay must be dropped explicitly
    // or it would still be on screen when the user comes back.
    const dismissLaunch = (force: boolean) => {
      const current = launchRef.current
      if (current && (force || Date.now() - current.key >= LAUNCH_MS)) {
        window.clearTimeout(launchTimerRef.current)
        launchRef.current = null
        setLaunch(null)
      }
    }
    const onRefresh = () => {
      dismissLaunch(false)
      refreshData()
    }
    const onVisibility = () => {
      setDocHidden(document.hidden)
      if (document.hidden) {
        resetPress()
        dismissLaunch(true)
      } else {
        dismissLaunch(false)
      }
    }
    const onPageHide = () => dismissLaunch(true)
    const onRefreshFocus = () => dismissLaunch(true)
    const onResume = () => dismissLaunch(true)
    const resetPress = () => {
      pressRef.current = null
      window.clearTimeout(pressTimerRef.current)
    }
    const onHome = () => {
      resetPress()
      setIsThemeModalOpen(false)
      setIsCreateModalOpen(false)
      setIsProfileModalOpen(false)
      setIsSettingsOpen(false)
      setIsAppsMenuOpen(false)
      setIsSurfsharkOpen(false)
      setOrganize(false)
      setMovingApp(false)
      window.clearTimeout(launchTimerRef.current)
      launchRef.current = null
      setLaunch(null)
      setSlide(0)
      const next = refreshData()
      setZone(next.slides.length ? 'hero' : next.continueItems.length ? 'continue' : 'apps')
    }
    window.addEventListener('launcher:refresh', onRefresh)
    window.addEventListener('launcher:resume', onResume)
    window.addEventListener('launcher:home', onHome)
    window.addEventListener('blur', resetPress)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('focus', onRefreshFocus)
    return () => {
      window.removeEventListener('launcher:refresh', onRefresh)
      window.removeEventListener('launcher:resume', onResume)
      window.removeEventListener('launcher:home', onHome)
      window.removeEventListener('blur', resetPress)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('focus', onRefreshFocus)
      window.clearTimeout(launchTimerRef.current)
    }
  }, [])

  const focusedIndex = indices[zone]

  useEffect(() => {
    if (modalOpen) return
    const el = itemRefs.current[zone][focusedIndex]
    el?.focus({ preventScroll: true })

    const shelf = zone === 'continue' ? continueShelfRef.current : zone === 'apps' ? appsShelfRef.current : null
    if (shelf && el) {
      const item = (el.parentElement ?? el) as HTMLElement
      const padding = window.innerWidth * 0.05
      const left = item.offsetLeft
      const right = left + item.offsetWidth
      const visibleLeft = shelf.scrollLeft + padding
      const visibleRight = shelf.scrollLeft + shelf.clientWidth - padding
      if (left < visibleLeft) shelf.scrollLeft = Math.max(0, left - padding)
      else if (right > visibleRight) shelf.scrollLeft = right - shelf.clientWidth + padding
    }

    const stack = stackRef.current
    if (!stack) return
    const section = zone === 'continue' ? continueSectionRef.current : zone === 'apps' || zone === 'appsControls' ? appsSectionRef.current : null
    const offset =
      section && (zone === 'continue' || zone === 'apps' || zone === 'appsControls')
        ? Math.max(0, section.offsetTop - window.innerHeight * shelfAnchor[zone === 'continue' ? 'continue' : 'apps'])
        : 0
    stack.style.transform = `translate3d(0, ${-offset}px, 0)`
  }, [zone, focusedIndex, ready, appsList.length, continueItems.length, modalOpen, slide])

  useEffect(() => {
    if (!settings.autoAdvanceHero || launch || heroSlides.length < 2 || zone === 'continue' || zone === 'apps' || zone === 'appsControls' || modalOpen) return
    const id = window.setTimeout(() => changeSlide(1), SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [slide, launch, changeSlide, heroSlides.length, zone, modalOpen, settings.autoAdvanceHero])

  useEffect(() => {
    launchRef.current = launch
    if (!launch) return
    const id = window.setTimeout(() => setLaunch(null), LAUNCH_MS)
    return () => window.clearTimeout(id)
  }, [launch])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(id)
  }, [notice])

  // Keep focus on a zone that exists when data changes underneath it.
  useEffect(() => {
    if (!ready) return
    if (zoneCounts[zone] === 0) setZone(homeZone)
    else if (indices[zone] >= zoneCounts[zone]) {
      setIndices((prev) => ({ ...prev, [zone]: zoneCounts[zone] - 1 }))
    }
    if (slide >= heroSlides.length && heroSlides.length) setSlide(0)
  })

  const browsing = zone === 'continue' || zone === 'apps' || zone === 'appsControls'
  // Nothing behind a modal, the launch overlay or a backgrounded window needs to keep animating.
  const animationsPaused = modalOpen || Boolean(launch) || docHidden

  if (!ready) return <main className="h-dvh w-full bg-black" />
  return (
    <main
      className="relative h-dvh w-full select-none overflow-hidden text-white"
      style={{
        backgroundColor: currentTheme.bg,
        // @ts-expect-error CSS variables
        '--tv-bg': currentTheme.bg,
        '--tv-accent': currentTheme.accent,
        '--tv-accent-text': currentTheme.accentText,
        '--tv-glow': currentTheme.glow1,
        '--tv-glow-2': currentTheme.glow2,
        '--tv-glass': currentTheme.glassBg,
        '--tv-glass-border': currentTheme.glassBorder,
      }}
    >
      <HeroBackdrop slides={heroSlides} activeIndex={slide} dimmed={browsing}
        paused={animationsPaused}
        kenBurns={settings.kenBurns}
        liveWallpaper={settings.liveWallpaper}
      />

      <TopHeader
        items={navItems.map((item) =>
          item.id === 'profile'
            ? { ...item, label: activeProfile?.name ?? item.label }
            : item,
        )}
        focusedIndex={zone === 'nav' ? focusedIndex : -1}
        registerRef={register('nav')}
        onHover={(i) => { if (pointerReadyRef.current) focusItem('nav', i) }}
        onActivate={(i) => activate('nav', i)}
        activeThemeName={currentTheme.name}
        clock24h={settings.clock24h}
        showWeather={settings.showWeather}
        currentTheme={currentTheme}
      />

      <div
        ref={stackRef}
        data-tv-paused={animationsPaused || undefined}
        className="relative z-10 transition-transform duration-300 ease-out motion-reduce:transition-none"
      >
        <HeroInfo
          slides={heroSlides}
          activeIndex={slide}
          focused={zone === 'hero'}
          visible={!browsing}
          paused={Boolean(launch)}
          slideDuration={SLIDE_MS}
          playRef={register('hero')(0)}
          onHover={() => { if (pointerReadyRef.current) focusItem('hero', 0) }}
          onPlay={() => activate('hero', 0)}
          onSelectSlide={setSlide}
        />

        <div className="flex flex-col gap-[3vh] pt-[2vh]">
          {continueItems.length > 0 && (
            <ContinueWatchingRow
              items={continueItems}
              focusedIndex={zone === 'continue' ? focusedIndex : -1}
              sectionRef={continueSectionRef}
              shelfRef={continueShelfRef}
              registerRef={registerContinue}
              onHover={hoverContinue}
              onActivate={activateContinue}
            />
          )}
          <AppsRow
            apps={appsList}
            organize={organize}
            movingApp={movingApp}
            onSetOrganize={(on) => { setOrganize(on); setMovingApp(false); if (on) focusItem('apps', Math.min(indices.apps, Math.max(0, appsList.length - 1))) }}
            hiddenCount={hiddenCount}
            onMoveApp={moveApp}
            onResetApps={resetApps}
            onOpenAppsMenu={() => openAppsMenu()}
            onEditRow={openRowEditor}
            currentTheme={currentTheme}
            focusedIndex={zone === 'apps' ? focusedIndex : -1}
            focusedControl={zone === 'appsControls' ? focusedIndex : -1}
            registerControlRef={register('appsControls')}
            onControlHover={(i) => { if (pointerReadyRef.current) focusItem('appsControls', i) }}
            sectionRef={appsSectionRef}
            shelfRef={appsShelfRef}
            registerRef={registerApps}
            onHover={hoverApps}
            onActivate={activateApps}
          />
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[5vh] z-40 flex justify-center">
        {notice && (
          <p
            key={notice.key}
            className="flex items-center gap-2 rounded-full bg-black/85 px-[1.5em] py-[0.7em] text-[clamp(12px,0.95vw,19px)] font-medium text-white ring-1 ring-inset ring-white/20 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-2xl"
            style={{ boxShadow: '0 8px 30px var(--tv-glow, rgba(0,0,0,0.5))' }}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--tv-accent, #38bdf8)' }} />
            {notice.text}
          </p>
        )}
      </div>

      {launch && <LaunchOverlay key={launch.key} launch={launch} onDismiss={() => {
        window.clearTimeout(launchTimerRef.current)
        launchRef.current = null
        setLaunch(null)
      }} />}

      <ProfileModal
        isOpen={isProfileModalOpen}
        profiles={profiles}
        activeId={activeProfileId}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitch={handleSwitchProfile}
        onAdd={handleAddProfile}
        onRename={handleRenameProfile}
        onDelete={handleDeleteProfile}
        onRestoreHidden={handleRestoreProfileHidden}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={themeId}
        allThemes={allThemes}
        onSelectTheme={handleSelectTheme}
        onOpenCreateModal={() => {
          setIsThemeModalOpen(false)
          setIsCreateModalOpen(true)
        }}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        currentTheme={currentTheme}
      />

      {isSettingsOpen && <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetApps={resetApps}
        installedAppsCount={installedIds.length}
        currentTheme={currentTheme}
        native={data.native}
        activeProfileName={activeProfile?.name}
        onSelectProfile={() => {
          setIsSettingsOpen(false)
          setIsProfileModalOpen(true)
        }}
        onOpenSystemSettings={data.native ? () => openSystem('settings') : undefined}
        onOpenDisplaySettings={data.native ? () => {
          if (!openSystem('display')) setNotice({ key: Date.now(), text: 'Could not open display settings' })
        } : undefined}
        onOpenSoundSettings={data.native ? () => {
          if (!openSystem('sound')) setNotice({ key: Date.now(), text: 'Could not open sound settings' })
        } : undefined}
        onOpenWifiSettings={data.native ? () => openSystem('wifi') : undefined}
        onOpenAccountSettings={data.native ? () => {
          if (!openSystem('accounts')) setNotice({ key: Date.now(), text: 'Could not open account settings' })
        } : undefined}
      />}

      <AppsMenuModal
        isOpen={isAppsMenuOpen}
        onClose={() => setIsAppsMenuOpen(false)}
        installedApps={installedIds}
        nativeApps={data.native ? appById : new Map()}
        homeRowApps={appsList}
        onLaunchApp={(id) => {
          setIsAppsMenuOpen(false)
          launchById(id)
        }}
        onToggleHomeRow={toggleHomeRow}
        onInstallApp={installApp}
        onUninstallApp={uninstallApp}
        onSearchPlayStore={data.native ? (query) => {
          const opened = query
            ? launchIntent(`intent://search?q=${encodeURIComponent(query)}&c=apps#Intent;scheme=market;package=com.android.vending;end`)
            : launchApp('com.android.vending')
          if (!opened) setNotice({ key: Date.now(), text: 'Could not open Google Play search' })
        } : undefined}
        onOpenPlayListing={data.native ? (pkg) => {
          if (!launchIntent(`intent://details?id=${encodeURIComponent(pkg)}#Intent;scheme=market;package=com.android.vending;end`)) {
            setNotice({ key: Date.now(), text: 'Could not open this Google Play listing' })
          }
        } : undefined}
        initialTab={appsMenuTab}
        initialRowEdit={appsMenuRowEdit}
        currentTheme={currentTheme}
        simulateInstall={!data.native}
      />

      <SurfsharkModal
        isOpen={isSurfsharkOpen}
        onClose={() => setIsSurfsharkOpen(false)}
        onOpen={() => {
          setIsSurfsharkOpen(false)
          const app = apps.find((candidate) => candidate.pkg === SURFSHARK_PACKAGE)
          if (app) launchById(idOf(app))
          else setNotice({ key: Date.now(), text: 'Surfshark is not installed' })
        }}
      />

      <ThemeCreator
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setIsThemeModalOpen(true)
        }}
        onSave={handleSaveCustomTheme}
        existingThemeCount={customThemes.length}
        currentTheme={currentTheme}
      />
    </main>
  )
}
