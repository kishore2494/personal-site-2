/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep-space palette
        void: {
          950: "#03040a",
          900: "#070912",
          800: "#0c1020",
          700: "#141a30",
        },
        // Cosmos cyan (AI / neural)
        nebula: {
          200: "#aef1ff",
          300: "#7fe8ff",
          400: "#34d3ff",
          500: "#11b8ee",
          600: "#0a8fc0",
        },
        // Amber star accent
        ember: {
          300: "#ffd9a0",
          400: "#ffb454",
          500: "#ff9417",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 6s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.2,0.6,0.2,1) infinite",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        blink: "blink 1s step-end infinite",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(52,211,255,0.45)",
        "glow-amber": "0 0 40px -8px rgba(255,180,84,0.45)",
      },
    },
  },
  plugins: [],
};
