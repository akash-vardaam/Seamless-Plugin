/**
 * ============================================================
 * SEAMLESS PLUGIN — CENTRALIZED DESIGN TOKENS
 * ============================================================
 * This is the SINGLE SOURCE OF TRUTH for all design values.
 *
 * All colors, spacing, font sizes, border radii, shadows,
 * transitions, and breakpoints live here.
 *
 * CSS variables are set from here via variables.css.
 * TypeScript consumers can import the constants directly.
 * ============================================================
 */

// ── Colors ────────────────────────────────────────────────────────────────────
export const COLORS = {
    primary: '#0f172a',
    secondary: '#00b2ca',
    hover: '#1e293b',
    active: '#0f172a',
    font: '#1e293b',
    heading: '#000000',
    background: '#f8fafc',

    white: '#ffffff',

    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray600: '#4b5563',
    gray700: '#374151',

    red50: '#fef2f2',
    red200: '#fecaca',
    red600: '#dc2626',
    red800: '#991b1b',

    teal100: '#ccf2f6',
    teal400: '#14b8a6',
    teal500: '#0d9488',

    borderColor: '#4a90e2',
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
    default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    serif: "'Merriweather', serif",
    montserrat: "'Montserrat', sans-serif",
} as const;

export const FONT_SIZES = {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
} as const;

// ── Transitions ───────────────────────────────────────────────────────────────
export const TRANSITIONS = {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
} as const;

// ── Border Radii ──────────────────────────────────────────────────────────────
export const RADII = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const SHADOWS = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;

// ── Z-Indices ─────────────────────────────────────────────────────────────────
export const Z_INDEX = {
    dropdown: 50,
    modal: 1000,
} as const;

// ── Breakpoints ───────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
} as const;

// ── Button Sizes ──────────────────────────────────────────────────────────────
export const BUTTON = {
    minHeight: '44px',
    paddingY: '0.75rem',
    paddingX: '1.5rem',
    paddingYSm: SPACING[2],
    paddingXSm: SPACING[4],
    fontWeight: 700,
    letterSpacing: '0.5px',
} as const;

// ── Container Width ───────────────────────────────────────────────────────────
export const LAYOUT = {
    containerMaxWidth: '80rem',
} as const;
