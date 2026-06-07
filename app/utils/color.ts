export const BLOSSOM_PALETTE_INNER = [
  { h: 0, s: 88, l: 62 },
  { h: 15, s: 90, l: 60 },
  { h: 30, s: 92, l: 58 },
  { h: 45, s: 95, l: 60 },
  { h: 55, s: 90, l: 58 },
  { h: 75, s: 78, l: 56 },
  { h: 100, s: 55, l: 55 },
  { h: 130, s: 52, l: 50 },
  { h: 155, s: 55, l: 50 },
  { h: 175, s: 60, l: 48 },
  { h: 190, s: 70, l: 52 },
  { h: 205, s: 75, l: 56 },
  { h: 225, s: 72, l: 58 },
  { h: 245, s: 68, l: 60 },
  { h: 265, s: 60, l: 58 },
  { h: 285, s: 55, l: 56 },
  { h: 310, s: 65, l: 58 },
  { h: 335, s: 75, l: 60 },
]

export const BLOSSOM_PALETTE_OUTER = [
  { h: 0, s: 65, l: 82 },
  { h: 20, s: 70, l: 84 },
  { h: 35, s: 72, l: 82 },
  { h: 50, s: 80, l: 82 },
  { h: 60, s: 72, l: 78 },
  { h: 80, s: 55, l: 78 },
  { h: 105, s: 45, l: 78 },
  { h: 135, s: 40, l: 76 },
  { h: 160, s: 42, l: 76 },
  { h: 178, s: 48, l: 76 },
  { h: 192, s: 55, l: 78 },
  { h: 208, s: 60, l: 80 },
  { h: 228, s: 58, l: 80 },
  { h: 248, s: 52, l: 80 },
  { h: 268, s: 48, l: 80 },
  { h: 288, s: 45, l: 80 },
  { h: 315, s: 52, l: 82 },
  { h: 340, s: 60, l: 82 },
]

export const BLOSSOM_PALETTE = [...BLOSSOM_PALETTE_OUTER, ...BLOSSOM_PALETTE_INNER]

export const COLOR_NAME_TO_HEX: Record<string, string> = {
  rose: '#f43f5e',
  pink: '#ec4899',
  fuchsia: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
}

export function ensureHexColor(value: string | undefined | null, fallback = '#6366f1'): string {
  if (!value) return fallback
  const lower = value.toLowerCase()
  if (lower.startsWith('#')) {
    return /^#[0-9a-f]{3,6}$/i.test(lower) ? lower : fallback
  }
  if (COLOR_NAME_TO_HEX[lower]) return COLOR_NAME_TO_HEX[lower]
  return value
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '')
  let r = 0, g = 0, b = 0
  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255
    g = parseInt(clean.substring(2, 4), 16) / 255
    b = parseInt(clean.substring(4, 6), 16) / 255
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255
    g = parseInt(clean[1] + clean[1], 16) / 255
    b = parseInt(clean[2] + clean[2], 16) / 255
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function getContrastColor(hex: string): 'black' | 'white' {
  const clean = hex.replace('#', '')
  if (clean.length < 3) return 'black'
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  return y > 128 ? 'black' : 'white'
}

export function hexToBlossomValue(hex: string): { hue: number; saturation: number; alpha: number; layer: 'inner' | 'outer' } {
  const hsl = hexToHsl(ensureHexColor(hex, '#6366f1'))
  return { hue: hsl.h, saturation: 30, alpha: 100, layer: 'outer' }
}
