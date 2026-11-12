/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@cfc/config/tailwind-preset")],
  // packages/ui MUST be scanned or shared components ship unstyled.
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
