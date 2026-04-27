/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Loopy brand palette
        loopy: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d1ff',
          300: '#9db0ff',
          400: '#7585ff',
          500: '#5660f5',
          600: '#4440e8',
          700: '#3a33ce',
          800: '#302ca6',
          900: '#2c2b83',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
