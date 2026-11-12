/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          rust: '#C1440E',
          dust: '#E77D11',
          sand: '#DDA059',
          dark: '#140E0A',
          charcoal: '#1A1817',
          surface: '#23201D',
        },
        hud: {
          amber: '#FFB000',
          cyan: '#00F0FF',
          green: '#00FF66',
          red: '#FF3333',
          dark: '#080808',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
