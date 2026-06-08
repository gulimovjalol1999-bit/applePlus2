import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0071e3',
          hover: '#0077ed',
          dark: '#2997ff',
        },
        ap: {
          black: '#1d1d1f',
          gray1: '#f5f5f7',
          gray2: '#e8e8ed',
          gray3: '#d2d2d7',
          text2: '#6e6e73',
          text3: '#a1a1a6',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"SF Pro Display"', '"Inter Display"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        container: '1400px',
      },
      borderRadius: {
        xl2: '20px',
        xl3: '24px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.25,0.1,0.25,1)',
        'slide-in-r': 'slideInRight 0.35s cubic-bezier(0.25,0.1,0.25,1)',
        'slide-in-l': 'slideInLeft 0.35s cubic-bezier(0.25,0.1,0.25,1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        shimmer: 'shimmer 1.8s infinite',
      },
    },
  },
  plugins: [],
}

export default config
