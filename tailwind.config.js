import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', ...defaultTheme.fontFamily.sans],
        display: ['Bebas Neue', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(255, 107, 0, 0.35)',
      },
      backgroundImage: {
        'metal-noise': "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 25%), radial-gradient(circle at bottom, rgba(255,255,255,0.03), transparent 20%)",
      },
      colors: {
        amber: '#FF6B00',
        'amber-light': '#FFB347',
        'amber-hover': '#E55A00',
        fire: '#FF6B00',
        charcoal: '#0D0D0D',
        navy: '#003366',
      },
    },
  },
  plugins: [],
};
