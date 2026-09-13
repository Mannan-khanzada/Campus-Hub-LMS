/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16213E",       // deep navy - sidebar, headings
        inkLight: "#2C3E66",
        parchment: "#FAF9F4", // warm off-white background
        card: "#FFFFFF",
        gold: "#C98A2E",      // primary accent
        goldSoft: "#F3E3C9",
        emerald: "#1E7A5A",   // success / present
        rose: "#B7434A",      // danger / absent
        slate: "#5B6478",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
