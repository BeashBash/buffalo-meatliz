/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Buffalo Meatliz brand palette (from baffalo.co.il)
        brand: {
          50:  '#fdf6f0',
          100: '#fae8d8',
          200: '#f5d0b0',
          300: '#ebb07e',
          400: '#de8a4e',
          500: '#c8692b',  // primary orange-brown
          600: '#a8501e',
          700: '#7c3b17',
          800: '#5c2c11',
          900: '#3d1d0b',
        },
        meat: {
          50:  '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#f83232',  // meat red
          600: '#e51111',
          700: '#c10b0b',
          800: '#a00d0d',
          900: '#841212',
        },
        dark: {
          900: '#1a1009',
          800: '#2d1b0e',
          700: '#3d2412',
          600: '#5c3820',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
