import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta corporativa POS
        corporate: {
          primary: '#1A3C6E',
          'primary-dark': '#0F2847',
          'primary-light': '#2A4C7E',
        },
        neutral: {
          bg: '#F4F5F7',
          'bg-dark': '#E5E7EB',
          border: '#D1D5DB',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          dark: '#15803D',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      minHeight: {
        touch: '44px', // Mínimo para botones táctiles
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
export default config;
