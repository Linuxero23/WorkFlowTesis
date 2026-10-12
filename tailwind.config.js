/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#123F5C',
          DEFAULT: '#19A9D1',
          light: '#65CBE4',
        },
        navy: '#25365F',
        background: '#F4F6F8',
        text: {
          primary: '#25365F',
          secondary: '#4A4A4A',
          muted: '#6B7280',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        brand: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}