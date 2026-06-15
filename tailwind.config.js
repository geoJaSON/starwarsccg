/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space UI surfaces
        space: {
          950: '#05060a',
          900: '#0a0c12',
          850: '#0e1118',
          800: '#141823',
          700: '#1b2130',
          600: '#272f43',
          500: '#3a4256',
        },
        // The Force: Light vs Dark side accents
        light: {
          DEFAULT: '#4ea8de',
          bright: '#7ec4f0',
          dim: '#2f6f9e',
        },
        dark: {
          DEFAULT: '#e5484d',
          bright: '#ff6b70',
          dim: '#9e2f33',
        },
        gold: {
          DEFAULT: '#f2c14e',
          bright: '#ffd76b',
          dim: '#c79a2e',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-light': '0 0 0 1px rgba(78,168,222,0.4), 0 0 18px rgba(78,168,222,0.25)',
        'glow-dark': '0 0 0 1px rgba(229,72,77,0.4), 0 0 18px rgba(229,72,77,0.25)',
        'glow-gold': '0 0 0 1px rgba(242,193,78,0.5), 0 0 18px rgba(242,193,78,0.25)',
      },
      backgroundImage: {
        starfield:
          'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.35), transparent), radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 90% 20%, rgba(255,255,255,0.4), transparent)',
      },
    },
  },
  plugins: [
    // `coarse:` applies on touch / no-hover devices so hover-revealed
    // controls (quick steppers, want star) stay visible on phones & tablets.
    function ({ addVariant }) {
      addVariant('coarse', '@media (hover: none)');
    },
  ],
};
