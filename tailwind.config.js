/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corp: {
          navy: '#1e1b4b',
          indigo: '#1e3a8a',
          sky: '#0369a1',
          cyan: '#38bdf8',
          ice: '#e0f2fe',
          slate: '#0f172a',
        },
      },
      fontFamily: {
        display: ['"Noto Sans SC"', '"Source Han Sans SC"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        body: ['"Noto Sans SC"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}
