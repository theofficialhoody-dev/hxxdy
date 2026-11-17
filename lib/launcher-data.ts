export type ServiceCategory =
  | 'Streaming'
  | 'Live TV & News'
  | 'Sports'
  | 'Music & Audio'
  | 'Gaming'
  | 'Media & Tools'

export type CatalogId =
  | 'netflix'
  | 'disney-plus'
  | 'max'
  | 'prime-video'
  | 'apple-tv'
  | 'hulu'
  | 'youtube'
  | 'spotify'
  | 'plex'
  | 'twitch'
  | 'crunchyroll'
  | 'paramount-plus'
  | 'peacock'
  | 'espn'
  | 'tubi'
  | 'pluto-tv'
  | 'vlc'
  | 'steam-link'
  | 'soundcloud'
  | 'retroarch'
  | 'f1-tv'
  | 'kodi'

/** Catalog ids for known brands; native apps without a brand entry are keyed by package name. */
export type ServiceId = CatalogId | (string & {})

export type LauncherApp = {
  pkg: string
  label: string
  icon: string
  service?: ServiceId
}

export type Service = {
  id: ServiceId
  name: string
  logo: string
  mono?: boolean
  category: ServiceCategory
  developer: string
  rating: number
  reviews: string
  size: string
  description: string
  tag?: string
  isDefaultInstalled?: boolean
  /** Registered at runtime from a real installed app; logo is then its 16:9 banner. */
  native?: boolean
}

export const services: Record<string, Service> = {
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    logo: '/brands/netflix.svg',
    category: 'Streaming',
    developer: 'Netflix, Inc.',
    rating: 4.8,
    reviews: '14.2M',
    size: '48 MB',
    description: 'Award-winning TV shows, movies, anime, and original documentaries in 4K HDR.',
    tag: '4K · HDR · Atmos',
    isDefaultInstalled: true,
  },
  'disney-plus': {
    id: 'disney-plus',
    name: 'Disney+',
    logo: '/brands/disney-plus.svg',
    mono: true,
    category: 'Streaming',
    developer: 'Disney Entertainment',
    rating: 4.7,
    reviews: '8.9M',
    size: '52 MB',
    description: 'The home for Disney, Pixar, Marvel, Star Wars, and National Geographic.',
    tag: 'IMAX Enhanced · Vision',
    isDefaultInstalled: true,
  },
  max: {
    id: 'max',
    name: 'Max',
    logo: '/brands/max.svg',
    mono: true,
    category: 'Streaming',
    developer: 'WarnerMedia Direct, LLC',
    rating: 4.6,
    reviews: '5.4M',
    size: '44 MB',
    description: 'Stream iconic HBO series, DC blockbusters, Warner Bros films, and Max Originals.',
    tag: '4K · HDR10+',
    isDefaultInstalled: true,
  },
  'prime-video': {
    id: 'prime-video',
    name: 'Prime Video',
    logo: '/brands/prime-video.svg',
    mono: true,
    category: 'Streaming',
    developer: 'Amazon Mobile LLC',
    rating: 4.5,
    reviews: '9.1M',
    size: '46 MB',
    description: 'Watch Amazon Originals, popular movies, TV series, and live Thursday Night Football.',
    tag: '4K · X-Ray',
    isDefaultInstalled: true,
  },
  'apple-tv': {
    id: 'apple-tv',
    name: 'Apple TV',
    logo: '/brands/apple-tv.svg',
    mono: true,
    category: 'Streaming',
    developer: 'Apple Inc.',
    rating: 4.9,
    reviews: '3.8M',
    size: '38 MB',
    description: 'Critically acclaimed Apple Original films and series from top storytellers.',
    tag: '4K · Spatial Audio',
    isDefaultInstalled: true,
  },
  hulu: {
    id: 'hulu',
    name: 'Hulu',
    logo: '/brands/hulu.svg',
    mono: true,
    category: 'Streaming',
    developer: 'Hulu LLC',
    rating: 4.4,
    reviews: '4.7M',
    size: '42 MB',
    description: 'Current season TV, hit movies, groundbreaking Hulu Originals, and FX shows.',
    tag: 'Next-Day TV',
    isDefaultInstalled: true,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    logo: '/brands/youtube.svg',
    category: 'Streaming',
    developer: 'Google LLC',
    rating: 4.9,
    reviews: '148M',
    size: '35 MB',
    description: 'Watch videos from creators worldwide, live streams, 4K HDR shorts, and music videos.',
    tag: '4K · 60fps · HDR',
    isDefaultInstalled: true,
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    logo: '/brands/spotify.svg',
    category: 'Music & Audio',
    developer: 'Spotify AB',
    rating: 4.8,
    reviews: '32M',
    size: '41 MB',
    description: 'Over 100 million songs, podcasts, and curated playlists on your TV with backdrop lyrics.',
    tag: 'Lossless Audio',
    isDefaultInstalled: true,
  },
  plex: {
    id: 'plex',
    name: 'Plex',
    logo: '/brands/plex.svg',
    category: 'Media & Tools',
    developer: 'Plex, Inc.',
    rating: 4.7,
    reviews: '1.2M',
    size: '56 MB',
    description: 'Stream 300+ free live TV channels and your personal home media collection from anywhere.',
    tag: 'Direct Play · NAS',
    isDefaultInstalled: true,
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    logo: '/brands/twitch.svg',
    category: 'Gaming',
    developer: 'Twitch Interactive, Inc.',
    rating: 4.6,
    reviews: '6.8M',
    size: '39 MB',
    description: 'Live gaming broadcasts, esports tournaments, creative streams, and live TV chat.',
    tag: '1080p60 · Chat',
    isDefaultInstalled: true,
  },
  crunchyroll: {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    logo: '/brands/crunchyroll.svg',
    category: 'Streaming',
    developer: 'Crunchyroll, LLC',
    rating: 4.8,
    reviews: '3.1M',
    size: '45 MB',
    description: 'The world’s largest anime library with simuldubs and subbed originals straight from Tokyo.',
    tag: 'Simulcast · 4K Anime',
    isDefaultInstalled: false,
  },
  'paramount-plus': {
    id: 'paramount-plus',
    name: 'Paramount+',
    logo: '/brands/paramount-plus.svg',
    category: 'Live TV & News',
    developer: 'Paramount Streaming',
    rating: 4.6,
    reviews: '2.5M',
    size: '58 MB',
    description: 'Live NFL on CBS, UEFA Champions League, Star Trek universe, and Yellowstone spinoffs.',
    tag: 'Live Sports · 4K HDR',
    isDefaultInstalled: false,
  },
  peacock: {
    id: 'peacock',
    name: 'Peacock',
    logo: '/brands/peacock.svg',
    category: 'Streaming',
    developer: 'Peacock TV LLC',
    rating: 4.5,
    reviews: '2.1M',
    size: '52 MB',
    description: 'Premier League live matches, exclusive WWE events, NBC hits, and universal cinema.',
    tag: 'Premier League Live',
    isDefaultInstalled: false,
  },
  espn: {
    id: 'espn',
    name: 'ESPN',
    logo: '/brands/espn.svg',
    category: 'Sports',
    developer: 'Disney Entertainment',
    rating: 4.7,
    reviews: '4.2M',
    size: '64 MB',
    description: 'Live sports coverage, scores, highlights, and thousands of live events with ESPN+.',
    tag: 'Live Sports Hub',
    isDefaultInstalled: false,
  },
  tubi: {
    id: 'tubi',
    name: 'Tubi TV',
    logo: '/brands/tubi.svg',
    category: 'Streaming',
    developer: 'Tubi, Inc.',
    rating: 4.8,
    reviews: '3.9M',
    size: '38 MB',
    description: '100% free legal streaming movies, complete TV series, and live news channels with no fees.',
    tag: '100% Free Streaming',
    isDefaultInstalled: false,
  },
  'pluto-tv': {
    id: 'pluto-tv',
    name: 'Pluto TV',
    logo: '/brands/pluto-tv.svg',
    category: 'Live TV & News',
    developer: 'Paramount Streaming',
    rating: 4.7,
    reviews: '2.8M',
    size: '41 MB',
    description: 'Drop in to 250+ free live channels including news, classic television, and on-demand movies.',
    tag: '250+ Live Channels',
    isDefaultInstalled: false,
  },
  vlc: {
    id: 'vlc',
    name: 'VLC for TV',
    logo: '/brands/vlc.svg',
    category: 'Media & Tools',
    developer: 'Videolabs',
    rating: 4.9,
    reviews: '2.9M',
    size: '28 MB',
    description: 'The open-source multi-platform media player that plays all disk files, streams, and network protocols.',
    tag: 'Universal Player',
    isDefaultInstalled: false,
  },
  'steam-link': {
    id: 'steam-link',
    name: 'Steam Link',
    logo: '/brands/steam-link.svg',
    category: 'Gaming',
    developer: 'Valve Corporation',
    rating: 4.7,
    reviews: '850K',
    size: '49 MB',
    description: 'Stream PC games from your Steam library right to your big screen TV with wireless controller support.',
    tag: '4K 60fps Game Stream',
    isDefaultInstalled: false,
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    logo: '/brands/soundcloud.svg',
    category: 'Music & Audio',
    developer: 'SoundCloud Global',
    rating: 4.6,
    reviews: '5.2M',
    size: '36 MB',
    description: 'Discover underground beats, live DJ sets, emerging artists, and independent podcasts.',
    tag: 'Lossless Audio',
    isDefaultInstalled: false,
  },
  retroarch: {
    id: 'retroarch',
    name: 'RetroArch',
    logo: '/brands/retroarch.svg',
    category: 'Gaming',
    developer: 'Libretro',
    rating: 4.8,
    reviews: '420K',
    size: '62 MB',
    description: 'Multi-system emulation frontend enabling classic console retro gaming with real-time rewinding.',
    tag: 'Retro Emulation',
    isDefaultInstalled: false,
  },
  'f1-tv': {
    id: 'f1-tv',
    name: 'F1 TV',
    logo: '/brands/f1-tv.svg',
    category: 'Sports',
    developer: 'Formula One Digital',
    rating: 4.6,
    reviews: '610K',
    size: '55 MB',
    description: 'Live Formula 1 Grand Prix races, onboard camera feeds, team radios, and live timing telemetry.',
    tag: 'Live Onboards · F1',
    isDefaultInstalled: false,
  },
  kodi: {
    id: 'kodi',
    name: 'Kodi',
    logo: '/brands/kodi.svg',
    category: 'Media & Tools',
    developer: 'XBMC Foundation',
    rating: 4.5,
    reviews: '3.4M',
    size: '75 MB',
    description: 'Award-winning open source media center designed for digital home theater entertainment.',
    tag: 'Media Center',
    isDefaultInstalled: false,
  },
}

export type HeroSlide = {
  id: string
  title: string
  backdrop: string
  logo: string
  service?: ServiceId
  eyebrow: string
  meta: string[]
  badges: string[]
  synopsis: string
  /** Nuvio featured slide fields */
  logoIsAlpha?: boolean
  appName?: string
  appIcon?: string
  intentUri?: string
  pkg?: string
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'northern-drift',
    title: 'Northern Drift',
    backdrop: '/hero/northern-drift.webp',
    logo: '/logos/northern-drift.webp',
    service: 'netflix',
    eyebrow: 'New Film',
    meta: ['2026', 'Survival Thriller', '2h 08m'],
    badges: ['4K', 'Dolby Vision', 'Atmos'],
    synopsis:
      'When a polar research station goes dark, a lone engineer crosses 80 miles of shifting ice to bring her crew home.',
  },
  {
    id: 'solace',
    title: 'Solace',
    backdrop: '/hero/solace.webp',
    logo: '/logos/solace.webp',
    service: 'max',
    eyebrow: 'Now Streaming',
    meta: ['2026', 'Sci-Fi', '2h 21m'],
    badges: ['4K', 'HDR10+', 'Atmos'],
    synopsis:
      'Stranded beneath a ringed giant, the last surveyor of a failed colony discovers the planet has been waiting for her.',
  },
  {
    id: 'gilded-hour',
    title: 'The Gilded Hour',
    backdrop: '/hero/gilded-hour.webp',
    logo: '/logos/gilded-hour.webp',
    service: 'apple-tv',
    eyebrow: 'New Episode Fridays',
    meta: ['Season 2', 'Period Drama', 'TV-14'],
    badges: ['4K', 'Dolby Vision', 'Atmos'],
    synopsis:
      'In 1920s Manhattan, an heiress turned informant plays both sides of a city drunk on fortune, jazz and secrets.',
  },
  {
    id: 'neon-tide',
    title: 'Neon Tide',
    backdrop: '/hero/neon-tide.webp',
    logo: '/logos/neon-tide.webp',
    service: 'prime-video',
    eyebrow: 'Original Series',
    meta: ['Season 1', 'Neo-Noir', 'TV-MA'],
    badges: ['4K', 'HDR', '5.1'],
    synopsis:
      'A rain-soaked city, a missing archivist and a detective who remembers a crime that has not happened yet.',
  },
]

export type ContinueItem = {
  id: string
  title: string
  detail: string
  remaining: string
  progress: number
  image: string
  service?: ServiceId
  logo: string
  quality?: string
  /** Nuvio Watch Next fields */
  backdrop?: string
  appName?: string
  appIcon?: string
  intentUri?: string
  pkg?: string
  description?: string
  historyOnly?: boolean
}

export const continueWatching: ContinueItem[] = [
  {
    id: 'harbor-lights',
    title: 'Harbor Lights',
    detail: 'S2 · E4',
    remaining: '18m left',
    progress: 0.62,
    image: '/thumbs/harbor-lights.webp',
    service: 'hulu',
    logo: '/logos/harbor-lights.svg',
    quality: '4K',
  },
  {
    id: 'solace-cw',
    title: 'Solace',
    detail: 'Film',
    remaining: '1h 04m left',
    progress: 0.55,
    image: '/hero/solace.webp',
    service: 'max',
    logo: '/logos/solace.svg',
    quality: '4K HDR',
  },
  {
    id: 'wild-kingdom',
    title: 'Wild Kingdom: Peaks',
    detail: 'E3 · The Ghost Cat',
    remaining: '31m left',
    progress: 0.35,
    image: '/thumbs/wild-kingdom.webp',
    service: 'disney-plus',
    logo: '/logos/wild-kingdom.svg',
    quality: '4K Atmos',
  },
  {
    id: 'kitchen-fire',
    title: 'Kitchen Fire',
    detail: 'S1 · E7',
    remaining: '6m left',
    progress: 0.86,
    image: '/thumbs/kitchen-fire.webp',
    service: 'hulu',
    logo: '/logos/kitchen-fire.svg',
    quality: 'HD',
  },
  {
    id: 'velocity',
    title: 'Velocity',
    detail: 'E2 · Dusk at Suzuka',
    remaining: '42m left',
    progress: 0.21,
    image: '/thumbs/velocity.webp',
    service: 'netflix',
    logo: '/logos/velocity.svg',
    quality: '4K HDR',
  },
  {
    id: 'paper-moons',
    title: 'Paper Moons',
    detail: 'Film',
    remaining: '49m left',
    progress: 0.48,
    image: '/thumbs/paper-moons.webp',
    service: 'disney-plus',
    logo: '/logos/paper-moons.svg',
    quality: '4K Vision',
  },
  {
    id: 'quiet-hours',
    title: 'Quiet Hours',
    detail: 'S3 · E9',
    remaining: '3m left',
    progress: 0.92,
    image: '/thumbs/quiet-hours.webp',
    service: 'apple-tv',
    logo: '/logos/quiet-hours.svg',
    quality: '4K Atmos',
  },
]

export const installedApps: ServiceId[] = [
  'netflix',
  'apple-tv',
  'disney-plus',
  'max',
  'prime-video',
  'youtube',
  'hulu',
  'spotify',
  'plex',
  'twitch',
]

/** Google Play package names for catalog brands, used to open their store page when not installed. */
export const PLAY_PACKAGES: Record<string, string> = {
  netflix: 'com.netflix.ninja',
  'disney-plus': 'com.disney.disneyplus',
  max: 'com.wbd.stream',
  'prime-video': 'com.amazon.amazonvideo.livingroom',
  'apple-tv': 'com.apple.atve.androidtv.appletv',
  hulu: 'com.hulu.livingroomplus',
  youtube: 'com.google.android.youtube.tv',
  spotify: 'com.spotify.tv.android',
  plex: 'com.plexapp.android',
  twitch: 'tv.twitch.android.app',
  crunchyroll: 'com.crunchyroll.crunchyroid',
  'paramount-plus': 'com.cbs.ott',
  peacock: 'com.peacocktv.peacockandroid',
  espn: 'com.espn.gtv',
  tubi: 'com.tubitv',
  'pluto-tv': 'tv.pluto.android',
  vlc: 'org.videolan.vlc',
  'steam-link': 'com.valvesoftware.steamlink',
  soundcloud: 'com.soundcloud.android',
  retroarch: 'com.retroarch',
  'f1-tv': 'com.formula1.tv',
  kodi: 'org.xbmc.kodi',
}

/** Adds real installed apps that have no catalog brand so every layer can look them up by id. */
export function registerNativeApps(apps: LauncherApp[]) {
  for (const app of apps) {
    const id = app.service ?? app.pkg
    if (services[id]) continue
    services[id] = {
      id,
      name: app.label,
      logo: app.icon,
      category: 'Media & Tools',
      developer: app.pkg,
      rating: 0,
      reviews: '',
      size: '',
      description: app.pkg,
      native: true,
    }
  }
}

export type NavItemId = 'profile' | 'theme' | 'network' | 'settings' | 'apps' | 'surfshark'

export const navItems: { id: NavItemId; label: string }[] = [
  { id: 'profile', label: 'Alex' },
  { id: 'theme', label: 'Theme' },
  { id: 'network', label: 'Wi-Fi · Home-5G' },
  { id: 'settings', label: 'Settings' },
  { id: 'apps', label: 'My Apps' },
]
