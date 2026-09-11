/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        piso: {
          // 60% Dominant Backgrounds & Large Surfaces
          bg: '#0B0F17',
          surface: '#111827',
          // 30% Secondary Containers, Cards & Borders
          card: '#161F30',
          panel: '#1E293B',
          border: '#334155',
          muted: '#94A3B8',
          // 10% Strategic Accents & Conversion CTAs
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          blue: '#2563EB',
          'blue-light': '#3B82F6',
          emerald: '#10B981',
          rose: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'blue-glow': '0 0 25px -5px rgba(37, 99, 235, 0.3)',
      },
    },
  },
  plugins: [],
};
