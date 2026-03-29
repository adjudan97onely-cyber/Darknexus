/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          50: '#ecf9ff',
          100: '#d0eeff',
          200: '#a0ddff',
          300: '#6bc4ff',
          400: '#34a4ff',
          500: '#0084ff',
          600: '#0068d4',
          700: '#0052d1',
          800: '#0042a8',
          900: '#003a87'
        },
        teal: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231'
        }
      }
    }
  },
  plugins: []
}
