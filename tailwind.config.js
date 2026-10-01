/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // DaVinci Resolve Professional NLE Palette
        resolve: {
          bg: '#181818',          // Main canvas / root workspace background
          panel: '#222222',       // Workspace panels, inspector windows, bins
          header: '#1E1E1E',      // Header bar / track control
          recessed: '#141414',    // Track well, indented monitor, text fields
          border: '#333333',      // Panel borders, divider rules
          borderHover: '#4A4A4A', // Hover/Active border
          accent: '#F26D21',      // Signature DaVinci Resolve Amber/Orange
          crimson: '#C73B3B',     // Record arm, critical status, clipping
          crimsonDark: '#8A2020',
          text: '#DEDEDE',        // Primary text (off-white)
          muted: '#888888',       // Secondary labels, track metadata
          dim: '#4D4D4D',         // Disabled indicators, timecode track
          light: '#F5F5F5'        // Pure white accents for active meters
        }
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '4px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px'
      }
    }
  },
  plugins: []
};
