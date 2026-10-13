/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        samsung: {
          blue: '#1428A0',
          dark: '#0D1B6F',
          light: '#4285F4',
          subtle: '#EEF2FF',
          accent: '#2563EB',
        },
        status: {
          received: '#DC2626',
          diagnosing: '#EA580C',
          waiting: '#D97706',
          repairing: '#2563EB',
          ready: '#16A34A',
          delivered: '#475569',
          cancelled: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
