import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Exact visual identity from the spec
      colors: {
        bg: '#F3F4F6',        // Main background (light gray)
        card: '#FFFFFF',      // Secondary background (white)
        primary: '#2563EB',   // Primary buttons (blue)
        'primary-dark': '#1D4ED8', // Button hover (dark blue)
        text: '#1F2937',      // Primary text (dark gray)
        muted: '#6B7280',     // Secondary text (medium gray)
        success: '#16A34A',   // Completed status (green)
        incomplete: '#D1D5DB', // Incomplete status (light gray)
        error: '#DC2626',     // Error status (red)
        border: '#E5E7EB',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg': '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        fadeSlide: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        fadeSlide: 'fadeSlide 0.25s ease-out',
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;