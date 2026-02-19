import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FEFDFB",
          100: "#FDF9F0",
          200: "#FAF0DC",
          300: "#F5E4C3",
          400: "#EED5A2",
          500: "#E5C07A",
        },
        ink: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          200: "#D6D3D1",
          300: "#A8A29E",
          400: "#78716C",
          500: "#57534E",
          600: "#44403C",
          700: "#36312D",
          800: "#292524",
          900: "#1C1917",
          950: "#0F0E0D",
        },
        sage: {
          50: "#F6F7F5",
          100: "#E8EBE5",
          200: "#D4DAD0",
          300: "#B5BFB0",
          400: "#8E9D87",
          500: "#6B7D63",
          600: "#556449",
          700: "#434F3A",
          800: "#374130",
          900: "#2E3629",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        book: "4px 4px 0px 0px rgba(28, 25, 23, 0.1)",
        "book-hover": "6px 6px 0px 0px rgba(28, 25, 23, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
