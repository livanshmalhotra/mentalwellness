/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        cardBg: "#161D30",
        primary: "#6366F1",
        secondary: "#10B981",
        accent: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
