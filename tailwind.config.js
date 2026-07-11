/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'surface':                '#f7f9fb',
        'surface-dim':            '#d8dadc',
        'surface-lowest':         '#ffffff',
        'surface-low':            '#f2f4f6',
        'surface-container':      '#eceef0',
        'surface-high':           '#e6e8ea',
        'surface-highest':        '#e0e3e5',
        'on-surface':             '#191c1e',
        'on-surface-variant':     '#45464d',
        'outline':                '#75777e',
        'outline-variant':        '#c5c6ce',

        // Brand
        'primary':                '#000000',       // nav, primary buttons
        'primary-container':      '#0e1b34',       // dark navy — sidebar bg, hero
        'on-primary-container':   '#7884a2',       // muted text on navy
        'inverse-primary':        '#bac6e7',       // light blue — links on dark bg

        // Settlement Green — success, released, positive
        'secondary':              '#006c4a',
        'secondary-container':    '#56febc',       // bright mint — success fills
        'on-secondary-container': '#00734f',

        // Dispute Amber — warnings, voting open, urgent
        'tertiary-container':     '#271900',
        'on-tertiary-container':  '#ac7b00',
        'tertiary-fixed-dim':     '#ffba20',       // amber badge bg

        // Error
        'error':                  '#ba1a1a',
        'error-container':        '#ffdad6',
        'on-error-container':     '#93000a',
      },
      fontFamily: {
        geist: ['Geist', 'sans-serif'],       // headlines, nav, structural text
        inter: ['Inter', 'sans-serif'],       // body, labels, table data
        mono:  ['JetBrains Mono', 'monospace'], // ALL blockchain strings
      },
      borderRadius: {
        sm:   '0.125rem',   // 2px
        DEFAULT: '0.25rem', // 4px — buttons, inputs
        md:   '0.375rem',   // 6px
        lg:   '0.5rem',     // 8px — data cards
        xl:   '0.75rem',    // 12px — modals
        full: '9999px',     // status pills only
      }
    },
  },
  plugins: [],
}
