import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pretty Decent Concepts brand palette.
        brand: {
          DEFAULT: "#906F4F", // medium brown -- primary actions
          dark: "#4A3628", // dark brown -- hover/emphasis
          light: "#BAA58E", // light taupe -- soft accents/borders
          tan: "#997F62", // camel
          accent: "#86322D", // dark red -- sparing use only
          ink: "#231F20", // near-black -- headings and body text
          cream: "#FBF8F3", // page background
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: [
          "var(--font-urbanist)",
          "-apple-system",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
