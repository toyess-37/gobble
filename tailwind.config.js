/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#1a1a1a',
          card: '#242424',
          input: '#141414',
          darker: '#060607',
          slider: '#2c2c2c'
        },
        primary: {
          DEFAULT: '#e66545',
          hover: '#d55434',
          active: '#c44728',
          light: 'rgba(230, 101, 69, 0.1)',
          lighter: 'rgba(230, 101, 69, 0.05)',
        },
        success: '#4caf50',
        error: {
          DEFAULT: '#ff6b6b',
          bg: 'rgba(255, 107, 107, 0.1)',
          border: 'rgba(255, 107, 107, 0.2)'
        },
        border: {
          DEFAULT: '#333333',
          light: '#444444',
          lighter: '#555555',
          dark: '#2a2a2a'
        },
        accent: {
          gold: '#e6a822',
          tile: '#f5f0e1',
          'tile-shadow': '#d1cbb0'
        },
        text: {
          DEFAULT: '#eaeaea',
          muted: '#888888',
          subtle: '#aaaaaa',
          dark: '#1a1a1a'
        }
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
