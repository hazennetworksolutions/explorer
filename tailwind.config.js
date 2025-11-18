/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        yes: '#10B981', // Green-500 for success/confirmed
        no: '#EF4444',  // Red-500 for error/failed
        info: '#3B82F6', // Blue-500 for info
        main: 'var(--text-main)',
        secondary: 'var(--text-secondary)',
        active: 'var(--bg-active)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['[data-theme=light]'],
          primary: '#3B82F6',    // Blue-500 - Trust & Technology
          secondary: '#64748B',  // Slate-500
          accent: '#06B6D4',     // Cyan-500
          success: '#10B981',    // Green-500 - Confirmed
          warning: '#F59E0B',    // Amber-500 - Pending
          error: '#EF4444',      // Red-500 - Failed
          info: '#3B82F6',       // Blue-500
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['[data-theme=dark]'],
          primary: '#3B82F6',    
          secondary: '#64748B',  
          accent: '#06B6D4',     
          success: '#10B981',    
          warning: '#F59E0B',    
          error: '#EF4444',      
          info: '#3B82F6',       
          'base-100': '#1F2937', // Gray-800 - Much lighter for better contrast
          'base-200': '#111827', // Gray-900
          'base-300': '#0F172A', // Slate-900
        },
      },
    ],
  },
};
