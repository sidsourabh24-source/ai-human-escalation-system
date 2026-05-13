/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bgStartLight: '#f8fafc',
        bgEndLight: '#e2e8f0',
        bgStartDark: '#0f172a',
        bgEndDark: '#020617',
        surfaceLight: 'rgba(255, 255, 255, 0.75)',
        surfaceDark: 'rgba(30, 41, 59, 0.75)',
        surfaceSolidLight: '#ffffff',
        surfaceSolidDark: '#1e293b',
        primary: '#4f46e5',
        primaryHover: '#4338ca',
        primaryDark: '#6366f1',
        primaryHoverDark: '#818cf8',
        success: '#10b981',
        warning: '#f59e0b',
        textLight: '#0f172a',
        textMutedLight: '#64748b',
        textDark: '#f8fafc',
        textMutedDark: '#94a3b8',
        borderLight: 'rgba(226, 232, 240, 0.8)',
        borderDark: 'rgba(51, 65, 85, 0.8)',
      }
    },
  },
  plugins: [],
}
