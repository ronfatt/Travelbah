import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "primary-dark": "var(--color-primary-dark)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        bg: "var(--color-bg)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        sand: "var(--color-bg)",
        ocean: "var(--color-primary)",
        sunset: "var(--color-accent)",
        leaf: "var(--color-primary-dark)",
        ink: "var(--color-text-primary)"
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.08)",
        glow: "0 8px 24px rgba(79,70,229,0.25)"
      }
    }
  },
  plugins: []
};

export default config;
