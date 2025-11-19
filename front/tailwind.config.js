/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        slack: {
          50: '#f8f8f8',
          100: '#f1f1f1',
          200: '#e8e8e8',
          300: '#d9d9d9',
          400: '#b4b4b4',
          500: '#808080',
          600: '#4a4a4a',
          700: '#2d2d2d',
          800: '#1a1a1a',
          900: '#000000',
        },
        primary: {
          50: '#e7f3ff',
          100: '#cfe7ff',
          200: '#9fcfff',
          300: '#6fb7ff',
          400: '#3f9fff',
          500: '#0f87ff',
          600: '#0d6fcc',
          700: '#0b5799',
          800: '#083f66',
          900: '#062733',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
