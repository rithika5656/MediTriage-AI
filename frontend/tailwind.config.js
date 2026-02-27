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
          50: '#e8edf5',
          100: '#c5d1e8',
          200: '#9eb3d8',
          300: '#7794c8',
          400: '#5a7ebe',
          500: '#3d68b4',
          600: '#1a3a6e',   // core dark navy
          700: '#142f5c',
          800: '#0e2449',
          900: '#081836',
        },
        navy: {
          50: '#eef1f8',
          100: '#d0d9ed',
          200: '#b0bee0',
          300: '#8ea2d3',
          400: '#6e8ac8',
          500: '#4e72bd',
          600: '#1b3a6b',
          700: '#152d54',
          800: '#0f213e',
          900: '#091528',
          950: '#05101e',
        },
        emergency: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        success: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0f213e 0%, #1b3a6b 50%, #1a3a6e 100%)',
        'card-gradient': 'linear-gradient(145deg, #ffffff 0%, #f0f4fb 100%)',
      },
      boxShadow: {
        'navy': '0 4px 20px rgba(15, 33, 62, 0.25)',
        'navy-lg': '0 8px 40px rgba(15, 33, 62, 0.35)',
        'card': '0 2px 12px rgba(15, 33, 62, 0.08)',
        'card-hover': '0 8px 30px rgba(15, 33, 62, 0.15)',
      }
    },
  },
  plugins: [],
}

