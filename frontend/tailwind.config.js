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
          DEFAULT: '#B93832',
          hover: '#982D28',
          soft: '#F8E5E3',
        },
        page: '#F8F7F4',
        surface: '#FFFFFF',
        foreground: {
          DEFAULT: '#242424',
          muted: '#777777',
        },
        border: {
          DEFAULT: '#E7E4DE',
          subtle: '#E7E4DE',
        },
        success: {
          DEFAULT: '#287A4B',
          soft: '#EAF5EF',
        },
        warning: {
          DEFAULT: '#9A6500',
          soft: '#FEF6E7',
        },
        error: {
          DEFAULT: '#B42318',
          soft: '#FEE4E2',
        },
        info: {
          DEFAULT: '#2864A0',
          soft: '#EBF3FB',
        },
      },
      borderRadius: {
        control: '9px',
        card: '14px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
      },
    },
  },
  plugins: [],
};
