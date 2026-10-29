/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E3A8A',      // primary - from logo 'Growth' text
          orange: '#F97316',    // accent - from logo 'wapi' text  
          purple: '#7C3AED',    // secondary - rocket trail
          light: '#EFF6FF',     // very light blue tint for backgrounds
          dark: '#0F172A',      // near-black for text
        }
      }
    },
  },
  plugins: [],
}
