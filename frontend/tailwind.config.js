/** @type {import('tailwindcss').Config} */
// If your environment expects CommonJS, replace `export default` with `module.exports =`
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}", // scan all source files for class usage
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
