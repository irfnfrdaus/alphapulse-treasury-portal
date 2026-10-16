/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B192C',
          800: '#0F2C59',
          700: '#1E3E62',
          600: '#2A528A',
        },
        slate: {
          850: '#151F32',
          950: '#0A0F1D'
        }
      }
    },
  },
  plugins: [],
}
