/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bcp: {
          navy: "#002a8d",
          orange: "#ff6200",
        },
      },
    },
  },
  plugins: [],
};
