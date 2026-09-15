/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        well: 'var(--bg-well)',
        'well-subtle': 'var(--bg-well-subtle)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        'btn-primary-bg': 'var(--btn-primary-bg)',
        'btn-primary-text': 'var(--btn-primary-text)',
        bullish: '#10B981',
        bearish: '#F43F5E',
        warning: '#F59E0B',
        shariah: '#A855F7',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card-light': '0 10px 30px -5px rgba(25, 28, 31, 0.04), 0 4px 12px -2px rgba(25, 28, 31, 0.025)',
        'card-dark': '0 0 30px rgba(0, 0, 0, 0.85)',
        'pop-light': '0 14px 34px -4px rgba(25, 28, 31, 0.07), 0 6px 16px -3px rgba(25, 28, 31, 0.03)',
        'pop-dark': '0 0 40px rgba(0, 0, 0, 0.95)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
        'glow-white': '0 0 16px rgba(255, 255, 255, 0.25)',
      },
    },
  },
  plugins: [],
}
