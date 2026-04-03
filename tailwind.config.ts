import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}', './server/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        aurora: {
          base: '#0d0d2b',
          violet: 'rgba(139, 92, 246, 0.45)',
          cyan: 'rgba(6, 182, 212, 0.35)',
          emerald: 'rgba(16, 185, 129, 0.30)',
        },
      },
      animation: {
        'float-1': 'float1 28s ease-in-out infinite',
        'float-2': 'float2 35s ease-in-out infinite',
        'float-3': 'float3 42s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30vw, -20vh)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-25vw, 15vh)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20vw, 25vh)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
