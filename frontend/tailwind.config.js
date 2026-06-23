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
          DEFAULT: '#3525cd',
          container: '#4f46e5',
          light: '#e2dfff',
          dim: '#c3c0ff',
          50: '#f5f2ff',
          100: '#e2dfff',
          200: '#c3c0ff',
          500: '#4f46e5',
          600: '#3525cd',
          700: '#2313b8',
          800: '#0f0069',
        },
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
          light: '#6ffbbe',
          50: '#ecfdf5',
        },
        tertiary: {
          DEFAULT: '#7e3000',
          container: '#a44100',
          light: '#ffdbcc',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dim: '#dcd8e5',
          bright: '#fcf8ff',
          container: '#f0ecf9',
          'container-high': '#eae6f4',
          'container-highest': '#e4e1ee',
          'container-low': '#f5f2ff',
          'container-lowest': '#ffffff',
          variant: '#e4e1ee',
        },
        on: {
          surface: '#1b1b24',
          'surface-variant': '#464555',
          primary: '#ffffff',
          'primary-container': '#dad7ff',
          secondary: '#ffffff',
          error: '#ffffff',
        },
        outline: {
          DEFAULT: '#777587',
          variant: '#c7c4d8',
        },
        error: {
          DEFAULT: '#EF4444',
          container: '#ffdad6',
        },
        success: '#10B981',
        warning: '#F59E0B',
        background: '#F3F4F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-lg': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
      },
      spacing: {
        'sidebar': '280px',
        'container-max': '1440px',
        'gutter': '24px',
      },
      boxShadow: {
        'card': '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
        'dropdown': '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
