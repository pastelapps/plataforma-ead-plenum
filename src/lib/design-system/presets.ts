export interface DesignPreset {
  name: string
  description: string
  colors: {
    primary500: string; primary600: string; secondary500: string;
    tertiary500: string; bgPage: string; bgSurface: string; sidebarBg: string;
  }
}

export const DEFAULT_PRESETS: DesignPreset[] = [
  {
    name: 'Azul Institucional',
    description: 'Clássico e profissional. Ideal para prefeituras e órgãos públicos.',
    colors: { primary500: '#3b82f6', primary600: '#2563eb', secondary500: '#22c55e', tertiary500: '#d946ef', bgPage: '#ffffff', bgSurface: '#f9fafb', sidebarBg: '#1e3a5f' },
  },
  {
    name: 'Verde Natureza',
    description: 'Fresco e acolhedor. Bom para temas de saúde, meio ambiente.',
    colors: { primary500: '#16a34a', primary600: '#15803d', secondary500: '#0ea5e9', tertiary500: '#f59e0b', bgPage: '#ffffff', bgSurface: '#f0fdf4', sidebarBg: '#14532d' },
  },
  {
    name: 'Roxo Educação',
    description: 'Moderno e criativo. Ótimo para cursos de tecnologia e inovação.',
    colors: { primary500: '#8b5cf6', primary600: '#7c3aed', secondary500: '#ec4899', tertiary500: '#f97316', bgPage: '#ffffff', bgSurface: '#faf5ff', sidebarBg: '#3b0764' },
  },
  {
    name: 'Terracota Cultura',
    description: 'Quente e acessível. Para cursos de cultura, artes e humanidades.',
    colors: { primary500: '#ea580c', primary600: '#c2410c', secondary500: '#84cc16', tertiary500: '#06b6d4', bgPage: '#fffbeb', bgSurface: '#fff7ed', sidebarBg: '#431407' },
  },
  {
    name: 'Escuro Elegante',
    description: 'Dark mode sofisticado. Para plataformas com visual premium.',
    colors: { primary500: '#6366f1', primary600: '#4f46e5', secondary500: '#14b8a6', tertiary500: '#f43f5e', bgPage: '#0f172a', bgSurface: '#1e293b', sidebarBg: '#020617' },
  },
]

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generatePaletteFromBase(base: string): Record<string, string> {
  const [h, s] = hexToHsl(base)
  return {
    '50': hslToHex(h, Math.max(s * 0.3, 5), 97),
    '100': hslToHex(h, Math.max(s * 0.4, 10), 93),
    '200': hslToHex(h, Math.max(s * 0.5, 15), 86),
    '300': hslToHex(h, Math.max(s * 0.6, 20), 75),
    '400': hslToHex(h, Math.max(s * 0.8, 25), 60),
    '500': base,
    '600': hslToHex(h, Math.min(s * 1.1, 100), 42),
    '700': hslToHex(h, Math.min(s * 1.15, 100), 34),
    '800': hslToHex(h, Math.min(s * 1.2, 100), 26),
    '900': hslToHex(h, Math.min(s * 1.2, 100), 20),
  }
}
