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
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out forwards",
        "fade-in": "fade-in 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
