import type { Config } from 'tailwindcss';
import { BREAKPOINTS } from './src/config/breakpoints';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        ipad: `${BREAKPOINTS.ipadMin}px`,
        desktop: `${BREAKPOINTS.desktopMin}px`
      },
      colors: {
        ink: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b'
        },
        fog: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5f5'
        },
        accent: {
          600: '#0ea5e9',
          500: '#38bdf8',
          400: '#7dd3fc'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
