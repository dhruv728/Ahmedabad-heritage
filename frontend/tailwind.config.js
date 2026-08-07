/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        heritage: {
          terracotta: '#C85A32',
          sandstone: '#E8D8C8',
          teak: '#4A2E1B',
          gold: '#D4AF37',
          polRed: '#8B261D',
          dark: '#1C1917',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
