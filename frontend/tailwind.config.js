/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF7',   // Crisp, bright fresh off-white cream
          100: '#FAF6EE',  // Light soft cream
          200: '#F4EEE1',  // Muted cream border
          300: '#E8DEC9',
        },
        deepred: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#C81E1E',
          800: '#B91C1C',  // Premium vibrant red accent
          900: '#881337',
        },
        darkbrown: {
          500: '#78350F',
          700: '#581C87',
          800: '#3C1503',  // Crisp readable typography
          900: '#230B01',
        },
        softyellow: {
          100: '#FEFCE8',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
        },
        warmorange: {
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        successgreen: {
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
