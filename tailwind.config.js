/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          dark: '#1E3A8A',
          light: '#EFF6FF',
          sky: '#0EA5E9',
        },
        slate: {
          900: '#0F172A',
          600: '#475569',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        status: {
          pending: { bg: '#FEF3C7', text: '#92400E' },
          approved: { bg: '#DCFCE7', text: '#15803D' },
          rejected: { bg: '#FEE2E2', text: '#B91C1C' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['16px', '1.5'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

