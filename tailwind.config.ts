import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F9FAFB',
        border: '#E5E7EB',
        primary: '#111827',
        secondary: '#6B7280',
        brand: '#6366F1',
        brandLight: '#EEF2FF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular']
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
}

export default config
