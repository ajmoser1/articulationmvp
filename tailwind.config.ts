import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem", /* 20px mobile */
        md: "2rem", /* 32px desktop */
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["'Crimson Pro'", "Georgia", "'Times New Roman'", "serif"],
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      fontSize: {
        /* Base 16px with generous line heights */
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.6" }],
        base: ["1rem", { lineHeight: "1.75", letterSpacing: "0.01em" }],
        lg: ["1.125rem", { lineHeight: "1.7" }],
        xl: ["1.25rem", { lineHeight: "1.6" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
        "5xl": ["3rem", { lineHeight: "1.15" }],
      },
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
        /* New semantic colors */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        deep: {
          DEFAULT: "hsl(var(--deep))",
          foreground: "hsl(var(--deep-foreground))",
        },
        /* Legacy warm colors - terracotta/cognac theme */
        warm: {
          cream: "hsl(40 33% 97%)",
          "cream-dark": "hsl(30 30% 93%)",
          charcoal: "hsl(0 0% 24%)",
          "brown-gray": "hsl(25 15% 38%)",
          terracotta: "hsl(17 47% 57%)",
          cognac: "hsl(24 43% 39%)",
          forest: "hsl(110 24% 34%)",
          burgundy: "hsl(350 48% 42%)",
          bronze: "hsl(43 86% 38%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      spacing: {
        /* Base 8px spacing system */
        "0.5": "0.125rem", /* 2px */
        "1": "0.25rem", /* 4px */
        "2": "0.5rem", /* 8px - base unit */
        "3": "0.75rem", /* 12px */
        "4": "1rem", /* 16px */
        "5": "1.25rem", /* 20px */
        "6": "1.5rem", /* 24px - minimum section gap */
        "8": "2rem", /* 32px - container padding desktop */
        "10": "2.5rem", /* 40px */
        "12": "3rem", /* 48px */
        "16": "4rem", /* 64px */
        "20": "5rem", /* 80px */
        "24": "6rem", /* 96px */
      },
      borderRadius: {
        /* Never sharp corners */
        none: "0",
        sm: "0.75rem", /* 12px - minimum */
        DEFAULT: "1rem", /* 16px */
        md: "1rem", /* 16px - inputs */
        lg: "1.25rem", /* 20px - buttons */
        xl: "1.5rem", /* 24px */
        "2xl": "2rem", /* 32px - cards/modals */
        "3xl": "2.5rem", /* 40px */
        full: "9999px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        button: "var(--shadow-button)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
