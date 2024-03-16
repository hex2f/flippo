import type { Config } from "tailwindcss"
const { fontFamily } = require("tailwindcss/defaultTheme")

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "3d-flip": {
          "0%": { transform: "perspective(400px) rotateY(0)" },
          "40%": { transform: "perspective(400px) rotateY(180deg)" },
          "60%": { transform: "perspective(400px) rotateY(180deg)" },
          "100%": { transform: "perspective(400px) rotateY(0)" },
        },
        "3d-spin": {
          "0%": { transform: "perspective(400px) rotateY(0)" },
          "100%": { transform: "perspective(400px) rotateY(360deg)" },
        },
        "fade-in-50": {
          "0%": { opacity: "0" },
          "50%": { opacity: "0" },
          "75%": { opacity: "1" },
        },
        "tile-drop": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "10%": { transform: "scale(1)", opacity: "0" },
          "35%": { transform: "scale(1.25)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "3d-flip": "3d-flip 0.6s ease-in-out",
        "3d-spin": "3d-spin 0.4s ease-in-out",
        "3d-spin-card-reveal": "fade-in-50 0.4s ease-in-out",
        "tile-drop": "tile-drop 0.3s ease-in-out forwards",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config