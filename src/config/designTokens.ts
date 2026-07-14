/**
 * KONEXA Enterprise Design Tokens
 * 
 * Strict, production-grade visual design standards across the platform.
 * Governs colors, typography, spacing, radii, elevations, and transitions.
 */

export const DesignTokens = {
  // Brand color scheme & Semantic definitions
  colors: {
    brand: {
      primary: "#000000",      // Slate / Deep Charcoal for supreme readability
      secondary: "#1A1A1A",    // Secondary brand surfaces
      accent: "#10B981",       // Trust Emerald for positive outcomes / trust score boosts
      danger: "#EF4444",       // Alert crimson
      warning: "#F59E0B",      // Caution gold
    },
    neutral: {
      black: "#000000",
      950: "#0A0A0A",
      900: "#171717",
      850: "#202020",
      800: "#262626",
      700: "#404040",
      500: "#737373",
      400: "#A3A3A3",
      300: "#D4D4D4",
      200: "#E5E5E5",
      100: "#F5F5F5",
      50: "#FAFAFA",
      white: "#FFFFFF",
    }
  },

  // Elegant, balanced typographic scales
  typography: {
    families: {
      sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
      display: '"Space Grotesk", "Outfit", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    sizes: {
      "3xs": "0.625rem",  // 10px - system metadata, fine details
      "2xs": "0.75rem",   // 12px - labels, side tags
      xs: "0.875rem",     // 14px - main body paragraphs
      sm: "1rem",         // 16px - subheadings, UI text
      md: "1.125rem",     // 18px - active card headers
      lg: "1.25rem",      // 20px - section headers
      xl: "1.5rem",       // 24px - modal titles
      "2xl": "1.875rem",  // 30px - page greetings
      "3xl": "2.25rem",   // 36px - hero display headings
    },
    weights: {
      light: "300",
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      black: "900",
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    }
  },

  // Rhythm spacing based on a 4px/8px modular grid
  spacing: {
    0: "0rem",
    0.5: "0.125rem",   // 2px
    1: "0.25rem",      // 4px
    1.5: "0.375rem",    // 6px
    2: "0.5rem",       // 8px
    2.5: "0.625rem",    // 10px
    3: "0.75rem",      // 12px
    4: "1rem",         // 16px
    5: "1.25rem",      // 20px
    6: "1.5rem",       // 24px
    8: "2rem",         // 32px
    10: "2.5rem",      // 40px
    12: "3rem",        // 48px
    16: "4rem",        // 64px
  },

  // Border radius scale for soft container architecture
  radius: {
    none: "0px",
    xs: "0.25rem",      // 4px - inputs, tag chips
    sm: "0.375rem",     // 6px - buttons
    md: "0.5rem",       // 8px - small dropdown lists
    lg: "0.75rem",      // 12px - cards
    xl: "1rem",         // 16px - dashboard sections
    "2xl": "1.5rem",    // 24px - main cards
    "3xl": "1.75rem",    // 28px - modal overlays
    full: "9999px",
  },

  // Elegant elevations that support responsive depth
  elevation: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  },

  // Smooth, delightful motion transitions
  transitions: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },
    timing: {
      ease: "ease",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    }
  }
};
