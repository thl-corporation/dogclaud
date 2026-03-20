/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alert: {
          green: '#22C55E',
          blue: '#3B82F6',
          yellow: '#EAB308',
          orange: '#F97316',
          redLight: '#EF4444',
          red: '#DC2626',
          redDark: '#B91C1C'
        }
      },
      animation: {
        'pulse-fast': 'pulse 0.5s ease-in-out infinite',
        'blink': 'blink 1s ease-in-out infinite'
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' }
        }
      }
    },
  },
  plugins: [],
}
