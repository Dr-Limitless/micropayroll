/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B1F3A',
          navy: '#0B1F3A',
          card: '#131b34',
          border: '#1e293b',
          accent: '#2E6BE6',
          accentHover: '#1d58cc',
        },
        mf: {
          navy: '#0B1F3A',
          accent: '#2E6BE6',
          bg: '#F5F7FA',
          card: '#FFFFFF',
          border: '#E4E8F0',
          borderDark: '#D0D5DD',
          text: '#101828',
          label: '#344054',
          muted: '#64748B',
          subtle: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
