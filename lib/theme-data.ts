export type ThemeGlowIntensity = 'subtle' | 'vibrant' | 'dramatic'

export type ThemeConfig = {
  id: string
  name: string
  description: string
  isCustom?: boolean
  // Core colors
  bg: string // e.g. '#000000'
  accent: string // e.g. '#3b82f6'
  accentText: string // e.g. '#ffffff' or '#000000'
  glow1: string // Primary ambient spotlight / aurora color
  glow2: string // Secondary ambient color
  glassBg: string // rgba for cards
  glassBorder: string // rgba for hairline borders
  intensity: ThemeGlowIntensity
}

export const BUILT_IN_THEMES: ThemeConfig[] = [
  {
    id: 'midnight-oled',
    name: 'Midnight OLED',
    description: 'Pure pitch black canvas with piercing icy azure focus glow.',
    bg: '#000000',
    accent: '#38bdf8',
    accentText: '#000000',
    glow1: 'rgba(56, 189, 248, 0.22)',
    glow2: 'rgba(59, 130, 246, 0.15)',
    glassBg: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    intensity: 'vibrant',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Electric cyan and neon magenta over deep obsidian synth space.',
    bg: '#050512',
    accent: '#06b6d4',
    accentText: '#000000',
    glow1: 'rgba(6, 182, 212, 0.28)',
    glow2: 'rgba(236, 72, 153, 0.24)',
    glassBg: 'rgba(6, 182, 212, 0.10)',
    glassBorder: 'rgba(6, 182, 212, 0.28)',
    intensity: 'dramatic',
  },
  {
    id: 'nordic-aurora',
    name: 'Nordic Aurora',
    description: 'Ethereal emerald and polar teal dancing across arctic darkness.',
    bg: '#021812',
    accent: '#34d399',
    accentText: '#022c22',
    glow1: 'rgba(52, 211, 153, 0.26)',
    glow2: 'rgba(20, 184, 166, 0.20)',
    glassBg: 'rgba(16, 185, 129, 0.10)',
    glassBorder: 'rgba(52, 211, 153, 0.25)',
    intensity: 'vibrant',
  },
  {
    id: 'crimson-cinema',
    name: 'Crimson Cinema',
    description: 'Theatrical red velvet and champagne gold from the golden age.',
    bg: '#140307',
    accent: '#f43f5e',
    accentText: '#ffffff',
    glow1: 'rgba(244, 63, 94, 0.25)',
    glow2: 'rgba(225, 29, 72, 0.18)',
    glassBg: 'rgba(244, 63, 94, 0.10)',
    glassBorder: 'rgba(251, 113, 133, 0.25)',
    intensity: 'vibrant',
  },
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    description: 'Warm dusk twilight with radiating ember coral and golden glow.',
    bg: '#170b06',
    accent: '#fb923c',
    accentText: '#180702',
    glow1: 'rgba(251, 146, 60, 0.26)',
    glow2: 'rgba(244, 63, 94, 0.18)',
    glassBg: 'rgba(251, 146, 60, 0.10)',
    glassBorder: 'rgba(253, 186, 116, 0.26)',
    intensity: 'vibrant',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    description: 'Deep celestial cosmos enveloped in rich radiant purple nebula.',
    bg: '#0d0419',
    accent: '#c084fc',
    accentText: '#1e053a',
    glow1: 'rgba(192, 132, 252, 0.26)',
    glow2: 'rgba(147, 51, 234, 0.22)',
    glassBg: 'rgba(192, 132, 252, 0.10)',
    glassBorder: 'rgba(216, 180, 254, 0.26)',
    intensity: 'vibrant',
  },
  {
    id: 'oceanic-abyss',
    name: 'Oceanic Abyss',
    description: 'Trench navy blue with bioluminescent marine aqua accents.',
    bg: '#03101c',
    accent: '#38bdf8',
    accentText: '#041d30',
    glow1: 'rgba(56, 189, 248, 0.24)',
    glow2: 'rgba(2, 132, 199, 0.20)',
    glassBg: 'rgba(56, 189, 248, 0.08)',
    glassBorder: 'rgba(125, 211, 252, 0.22)',
    intensity: 'subtle',
  },
  {
    id: 'solar-dune',
    name: 'Solar Dune',
    description: 'Burnished bronze and desert spice sands illuminated by sun flares.',
    bg: '#1c1004',
    accent: '#fbbf24',
    accentText: '#261603',
    glow1: 'rgba(251, 191, 36, 0.26)',
    glow2: 'rgba(217, 119, 6, 0.20)',
    glassBg: 'rgba(251, 191, 36, 0.09)',
    glassBorder: 'rgba(252, 211, 77, 0.25)',
    intensity: 'vibrant',
  },
  {
    id: 'matrix-monolith',
    name: 'Matrix Monolith',
    description: 'Phosphor green CRT terminal glow piercing ultra-dark void.',
    bg: '#020d04',
    accent: '#4ade80',
    accentText: '#022108',
    glow1: 'rgba(74, 222, 128, 0.26)',
    glow2: 'rgba(34, 197, 94, 0.18)',
    glassBg: 'rgba(74, 222, 128, 0.09)',
    glassBorder: 'rgba(134, 239, 172, 0.26)',
    intensity: 'vibrant',
  },
  {
    id: 'minimalist-titanium',
    name: 'Minimalist Titanium',
    description: 'Brushed graphite monochrome with pure crisp platinum highlights.',
    bg: '#0c0e12',
    accent: '#ffffff',
    accentText: '#000000',
    glow1: 'rgba(255, 255, 255, 0.18)',
    glow2: 'rgba(148, 163, 184, 0.14)',
    glassBg: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.20)',
    intensity: 'subtle',
  },
]

const STORAGE_KEY_CURRENT = 'tv_launcher_theme_id'
const STORAGE_KEY_CUSTOM = 'tv_launcher_custom_themes'

export function getStoredThemeId(): string {
  if (typeof window === 'undefined') return BUILT_IN_THEMES[0].id
  try {
    return localStorage.getItem(STORAGE_KEY_CURRENT) || BUILT_IN_THEMES[0].id
  } catch {
    return BUILT_IN_THEMES[0].id
  }
}

export function setStoredThemeId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, id)
  } catch {
    // Ignore storage errors
  }
}

export function getCustomThemes(): ThemeConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomThemeToStorage(theme: ThemeConfig): ThemeConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getCustomThemes()
    const index = current.findIndex((t) => t.id === theme.id)
    let updated: ThemeConfig[]
    if (index >= 0) {
      updated = [...current]
      updated[index] = theme
    } else {
      updated = [theme, ...current]
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export function deleteCustomThemeFromStorage(id: string): ThemeConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getCustomThemes()
    const updated = current.filter((t) => t.id !== id)
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}
