// src/theme/theme.js
export const theme = {
  colors: {
    // Background (match mockup dark navy)
    bgTop: '#050712',
    bgBottom: '#0B1020',

    // Surfaces / cards
    surface: 'rgba(255,255,255,0.06)',
    surfaceStrong: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.10)',

    // Text
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.60)',
    textSoft: 'rgba(255,255,255,0.45)',

    // Brand / accents
    primary: '#7C4DFF',      // purple
    primary2: '#3B82F6',     // blue-ish for gradients
    inactive: '#7D8596',     // inactive icon/text gray

    // Status
    success: '#2EE59D',
    danger: '#FF4D4D',
  },

  spacing: {
    // ✅ Use this everywhere for consistent screen width
    screenPadding: 20,

    // header spacing consistency
    headerTop: 10,
    headerBottom: 14,

    // cards
    cardPadding: 16,
    cardGap: 12,

    // bottom navbar inset (matches your event details screenshot look)
    navInset: 20,
    navBottom: 26,
  },

  radius: {
    card: 18,
    pill: 999,
    nav: 22,
    fab: 999,
  },

  shadow: {
    // light glow-ish shadow
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 10,
    },
  },
};
