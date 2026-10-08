import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Brand palette
        night: "#0A0A0A", // canvas
        basalt: "#121212", // cards
        signal: "#E6D65C", // the trail: primary actions, focus, line art
        mist: "#F2F2EC", // body text
        lichen: "#9A9A90", // secondary text
        ridge: "#2A2A2A", // borders
        ember: "#FF6B57", // errors and destructive actions

        // shadcn/ui tokens, mapped onto the brand palette in globals.css
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      fontFamily: {
        sans: ['"Archivo Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // A classic typographic scale on a 16px body
        "2xs": ["0.75rem", { lineHeight: "1.1rem" }],
        xs: ["0.8125rem", { lineHeight: "1.2rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.65rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.3125rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "4xl": ["3rem", { lineHeight: "3.1rem" }],
        "5xl": ["4.5rem", { lineHeight: "4.4rem" }],
      },
      borderRadius: {
        panel: "20px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    animate,
    // Archivo has a width axis; width is the type system's main voice.
    plugin(({ addUtilities }) => {
      addUtilities({
        ".stretch-wide": { "font-stretch": "125%" },
        ".stretch-semiwide": { "font-stretch": "112.5%" },
        ".stretch-normal": { "font-stretch": "100%" },
        ".stretch-semicondensed": { "font-stretch": "87.5%" },
        ".stretch-narrow": { "font-stretch": "75%" },
      });
    }),
  ],
};

export default config;
