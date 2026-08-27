/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#06131f",
          900: "#0a1f2e",
          800: "#10354a",
          700: "#15536b"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(34,211,238,.10)"
      }
    }
  },
  plugins: []
};