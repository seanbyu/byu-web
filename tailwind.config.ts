import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        // Locale-aware font stacks
        sans: [
          "var(--font-geist-sans)",
          "var(--font-noto-kr)",
          "var(--font-noto-thai)",
          "system-ui",
          "sans-serif",
        ],
        thai: ["var(--font-noto-thai)", "sans-serif"],
        korean: ["var(--font-noto-kr)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
