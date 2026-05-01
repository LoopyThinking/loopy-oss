/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Semantic surface tokens */
        page:     'var(--bg-page)',
        panel:    'var(--bg-panel)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        card:     'var(--bg-card)',
        hover:    'var(--bg-hover)',

        /* Text tokens */
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        subtle:    'var(--text-subtle)',

        /* Border tokens */
        'edge':        'var(--border)',
        'edge-subtle': 'var(--border-subtle)',

        /* Brand */
        'accent':       'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-light': 'var(--accent-light)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontWeight: {
        'ui':       '510',
        'semibold': '590',
      },
      letterSpacing: {
        'display-xl': '-0.022em',
        'display-lg': '-0.022em',
        'display':    '-0.022em',
        'heading':    '-0.022em',
        'sub':        '-0.012em',
        'tight':      '-0.012em',
      },
      borderRadius: {
        'micro': '2px',
        'sm':    '4px',
        DEFAULT: '6px',
        'md':    '8px',
        'lg':    '12px',
        'xl':    '22px',
      },
      boxShadow: {
        'card':    '0 0 0 1px rgba(0,0,0,0.08)',
        'elevated': '0 2px 4px rgba(0,0,0,0.4)',
        'dialog':  '0 8px 2px rgba(0,0,0,0), 0 5px 2px rgba(0,0,0,0.01), 0 3px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.08)',
        'focus':   '0 4px 12px rgba(0,0,0,0.1)',
        'inset-dark': 'inset 0 0 12px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
