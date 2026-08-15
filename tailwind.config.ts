import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "pulse-glow-red": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 46, 46, 0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(255, 46, 46, 0)" },
        },
      },
      animation: {
        "pulse-glow-red": "pulse-glow-red 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
