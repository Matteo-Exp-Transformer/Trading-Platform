/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Tema per-utente (M6): le classi `dark:` si attivano quando <html> ha la classe `dark`
  // (impostata da lib/theme.js in base a profiles.theme). La palette ricca è M7.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Accento del brand: ciano (M7, era verde), identico in tema chiaro e scuro.
        freedom: {
          bg: '#020617',
          accent: '#06b6d4',
          accentHover: '#22d3ee',
        },
        // Token semantici del tema (M6): valori reali in src/index.css (:root chiaro / .dark scuro).
        // `<alpha-value>` mantiene funzionanti le utility con opacità (es. text-muted/70).
        app: 'rgb(var(--color-app) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          strong: 'rgb(var(--color-surface-strong) / <alpha-value>)',
          stronger: 'rgb(var(--color-surface-stronger) / <alpha-value>)',
        },
        content: 'rgb(var(--color-content) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        faint: 'rgb(var(--color-faint) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
