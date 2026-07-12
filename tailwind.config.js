/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#26DE81",
        accent: "#E8551B",
        surface: "#F8FAFC",
        text: "#1F2937",
        muted: "#6B7280",
        border: "#E5E7EB",
        ink: "#17201d",
        cream: "#f6f4ed",
        lime: "#d9ff5f",
        forest: "#174f3b",
        "text-main": "#1F2937",
        "text-secondary": "#6B7280",
        background: "#FFFFFF",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 32, 29, 0.08)",
        glow: "0 0 30px rgba(32, 191, 107, 0.32)",
        laptop: "0 24px 90px rgba(31, 41, 55, 0.24)",
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        h1: ["48px", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        h2: ["36px", { lineHeight: "1.18", letterSpacing: "-0.02em" }],
        h3: ["28px", { lineHeight: "1.25" }],
        h4: ["24px", { lineHeight: "1.3" }],
        h5: ["22px", { lineHeight: "1.35" }],
        h6: ["18px", { lineHeight: "1.4" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
      },
      keyframes: {
        "liquid-shift": {
          "0%": { transform: "translateX(-18%)" },
          "100%": { transform: "translateX(18%)" },
        },
      },
      animation: {
        "liquid-shift": "liquid-shift 2.6s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
