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
        sand: "#f6efe0",
        ocean: "#1b657d",
        sunset: "#f78a4d",
        leaf: "#4f7a57",
        ink: "#1f2937"
      },
      boxShadow: {
        card: "0 12px 30px -16px rgba(16,24,40,.35)"
      }
    }
  },
  plugins: []
};

export default config;
