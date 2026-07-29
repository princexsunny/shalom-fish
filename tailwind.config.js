/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme. Names kept so existing markup maps over automatically:
        // ink-900 = page/base surface (now white), 800/700 = subtle greys.
        ink: {
          900: "#FFFFFF",
          800: "#F8FAFC",
          700: "#F1F5F9",
          600: "#E2E8F0",
        },
        lime: { accent: "#65A30D" }, // darker lime → readable on white
        emerald: { glow: "#059669" },
        aqua: { DEFAULT: "#0E7490" },
        discount: "#EA580C",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        // soft neutral shadows read better than neon glow on a light theme
        glow: "0 8px 24px -8px rgba(15,23,42,0.18)",
        "glow-lime": "0 8px 24px -6px rgba(101,163,13,0.35)",
        frost: "0 10px 30px -12px rgba(15,23,42,0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};
