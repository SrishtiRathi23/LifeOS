import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        parchment: "var(--parchment)",
        peach: "var(--peach)",
        terracotta: "var(--terracotta)",
        brown: "var(--brown)",
        "dark-brown": "var(--dark-brown)",
        blush: "var(--blush)",
        sage: "var(--sage)",
        "dusty-rose": "var(--dusty-rose)",
        charcoal: "var(--charcoal)",
        line: "var(--line)",
        card: "var(--card)",
        ink: "var(--ink)"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["DM Sans", "sans-serif"],
        accent: ["Dancing Script", "cursive"]
      },
      boxShadow: {
        glow: "0 18px 45px -28px rgba(196, 149, 106, 0.65)"
      }
    }
  },
  plugins: []
} satisfies Config;
