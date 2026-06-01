/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#d9e6ff', 200: '#bcd2ff', 300: '#8eb4ff',
          400: '#598bff', 500: '#3563ff', 600: '#1d40f5', 700: '#162fe1',
          800: '#1828b6', 900: '#1a298f', 950: '#151a52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
