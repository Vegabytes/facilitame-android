/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hanken", "sans-serif"], // Configurar la fuente por defecto
      },
      colors: {
        primary: "#30D4D1", // FACILITAME
        secondary: "#FFA500",
        background: "#97E9E8", // FACILITAME
        text: "#333333",
        button: "#1E4C59", // FACILITAME
        success: "#28a745",
        warning: "#FFC107",
        danger: "#DC3545",
        bright: "#C1F2F1", // FACILITAME
      },
    },
  },
  plugins: [],
};
