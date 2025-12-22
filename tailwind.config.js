/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}", "!./node_modules/**/*"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        heading: ["Poppins", "Inter", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        brand: {
          bg: "#F8FAFC", // slate-50-ish
          surface: "#FFFFFF", // white
          ink: "#0F172A", // slate-900
          muted: "#475569", // slate-600
          border: "#E2E8F0", // slate-200
          primary: "#111827", // gray-900
          accent: "#2563EB", // blue-600
          accent2: "#06B6D4", // cyan-500
        },
        state: {
          success: "#16A34A", // green-600
          warning: "#F59E0B", // amber-500
          danger: "#DC2626", // red-600
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
