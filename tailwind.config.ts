import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Anthropic warm beige theme from option-b2.html
        background: {
          DEFAULT: '#F5F0E8',
          card: '#FEFCF9',
          elevated: '#FFFFFF',
          muted: '#EDE8DE',
        },
        text: {
          primary: '#1A1915',
          secondary: '#6B6560',
          tertiary: '#A39E96',
        },
        border: {
          DEFAULT: '#E5DFD5',
          strong: '#D5CDC2',
        },
        accent: '#C5714B',
        up: '#C4391D',
        down: '#2D8A56',
        // Dark mode
        dark: {
          background: '#1A1915',
          card: '#242320',
          elevated: '#2E2D29',
          muted: '#2E2D29',
          text: {
            primary: '#F5F0E8',
            secondary: '#A39E96',
            tertiary: '#6B6560',
          },
          border: '#3A3832',
          'border-strong': '#4A4842',
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      gradients: {
        gold: 'linear-gradient(135deg, #1A1915, #8B6914, #C5944A)',
      }
    },
  },
  plugins: [],
}
export default config