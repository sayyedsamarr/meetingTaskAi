/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0f1115",
          surface: "#171a21",
          "surface-2": "#1f232c",
          border: "#2a2f3a",
        },
        ink: {
          DEFAULT: "#e8e9ec",
          muted: "#8b90a0",
          faint: "#5b606f",
        },
        brand: {
          DEFAULT: "#6c8eef",
          dim: "#3d4a7a",
        },
        signal: {
          high: "#ef6461",
          medium: "#e0a458",
          low: "#4fb286",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'SF Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
