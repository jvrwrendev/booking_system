/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#0F172A",
        background: "#FFFFFF",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        success: "#16A34A",
        warning: "#D97706",
        info: "#2563EB",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        lg: 12,
        md: 8,
        sm: 6,
      },
    },
  },
  plugins: [],
};
