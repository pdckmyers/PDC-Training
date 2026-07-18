import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#33635f",
          dark: "#1f4441",
        },
      },
    },
  },
  plugins: [],
};

export default config;
