/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'editor-text': '#d4d4d4',
      }
    },
  },
  plugins: [],
}

