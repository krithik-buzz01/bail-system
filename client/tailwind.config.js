/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070F1E',
          900: '#0B192C',
          800: '#15294A',
          700: '#1E3E62',
          600: '#2A5584'
        },
        teal: {
          600: '#0E8388',
          500: '#008DDA',
          400: '#41B06E'
        },
        warm: {
          500: '#F15412',
          400: '#FFB200'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
