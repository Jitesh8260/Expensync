/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 Important for theme toggling via class
  theme: {
    extend: {
      fontFamily: {
        sans: ["Segoe UI", "Roboto", "sans-serif"],
        code: ["source-code-pro", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
}
