/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette beta (provvisoria, verrà rifinita a M7).
        freedom: {
          bg: '#0b1f1a',
          accent: '#2dd4a7',
        },
      },
    },
  },
  plugins: [],
};
