/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        caribbean: {
          blue: "#0a4c8b",
          turquoise: "#11b5c9",
          coral: "#f45d48",
          sun: "#f8c537",
          leaf: "#1ca76b"
        }
      }
    },
  },
  plugins: [],
}

