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
        ink: {
          900: "#021B17",
          800: "#062F27",
          700: "#0D3C33",
          600: "#114A3E",
        },
        lime: { accent: "#A3E635" },
        emerald: { glow: "#34D399" },
        aqua: { DEFAULT: "#5EEAD4" },
        discount: "#FB923C",
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
        glow: "0 0 40px -8px rgba(52,211,153,0.45)",
        "glow-lime": "0 0 44px -6px rgba(163,230,53,0.5)",
        frost: "0 20px 60px -20px rgba(0,0,0,0.6)",
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
