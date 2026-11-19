import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#09090F',
          secondary: '#11111B',
          card: '#181824',
        },
        accent: {
          violet: '#7C3AED',
          violetHover: '#6D28D9',
          blue: '#2563EB',
          electric: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-padauk)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
