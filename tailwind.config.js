/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        courier: ['"Courier Prime"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Digits drawn by the web (timers, counters): the app's SF Pro Rounded,
        // and Nunito (index.html loads the digits only) where that does not exist.
        rounded: ['ui-rounded', '"SF Pro Rounded"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // The app's accent (accentGreen). Links, active states, focus rings.
        'opus-green': '#7A9B58',
        'opus-green-dim': '#93B571',
        // Luminous icon greens: geometry and the brand mark only, never text.
        'loop-glow': '#64D262',
        'loop-core': '#14E468',
        paper: '#E8E6E1',
        surface: '#0E0E10',
        // Body copy (the app's secondary text), 7.6:1 on black.
        muted: '#9A9AA0',
      },
    },
  },
  plugins: [],
}
