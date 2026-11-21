import { Platform } from 'react-native';

/**
 * Centralized A6News Infra design tokens extracted from migration specification (Section 6).
 * Visual identity: Solid white editorial/news interface with #E50000 brand red,
 * crisp 1px borders, no gradients, and no glassmorphism.
 */

export const COLORS = {
  // Primary Brand & Red Palette
  brandRed: '#E50000',
  primary: '#E50000',
  brandRedDark: '#B91C1C',
  red700: '#B91C1C',
  brandRedDeep: '#991B1B',
  red800: '#991B1B',
  red600: '#DC2626',
  red400: '#F87171',
  red400Alpha40: 'rgba(248, 113, 113, 0.4)',
  red400Alpha50: 'rgba(248, 113, 113, 0.5)',
  red200: '#FECACA',
  red100: '#FEE2E2',
  red50: '#FEF2F2',
  tickerBackground: 'rgba(254, 242, 242, 0.6)',
  red50Alpha60: 'rgba(254, 242, 242, 0.6)',
  red50Alpha70: 'rgba(254, 242, 242, 0.7)',

  // Backgrounds & Surfaces
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  gray50: '#F9FAFB',
  backgroundSecondary: '#F9FAFB',
  neutral50: '#FAFAFA',
  inlinePhotoBackdrop: '#FAFAFA',
  neutral100: '#F5F5F5',
  thumbnailBackdrop: '#F5F5F5',
  neutral900: '#171717',
  heroViewportDark: '#171717',
  neutral950: '#0A0A0A',
  lightboxViewportDark: '#0A0A0A',
  black: '#000000',

  // Text & Grayscale
  gray900: '#111827',
  textPrimary: '#111827',
  heading: '#111827',
  gray800: '#1F2937',
  textBody: '#1F2937',
  gray700: '#374151',
  textSecondary: '#374151',
  gray600: '#4B5563',
  textMuted: '#4B5563',
  gray500: '#6B7280',
  textMeta: '#6B7280',
  gray400: '#9CA3AF',
  textPlaceholder: '#9CA3AF',

  // Borders, Dividers & Status
  gray300: '#D1D5DB',
  borderInput: '#D1D5DB',
  gray200: '#E5E7EB',
  border: '#E5E7EB',
  borderCard: '#E5E7EB',
  gray100: '#F3F4F6',
  borderSubtle: '#F3F4F6',
  tagBackground: '#F3F4F6',
  green600: '#16A34A',
  success: '#16A34A',
  green700: '#15803D',
  successText: '#15803D',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',

  // Semantic Editorial Accent (Admin Quick Actions & Info Banners)
  accentBlue: '#1D4ED8',
  accentBlueBg: '#EFF6FF',
  accentBlueBorder: '#BFDBFE',

  // Overlays & Alpha Neutrals
  modalBackdrop: 'rgba(0, 0, 0, 0.5)',
  lightboxBackdrop: 'rgba(0, 0, 0, 0.85)',
  imageRemoveBackdrop: 'rgba(0, 0, 0, 0.75)',
  whiteAlpha85: 'rgba(255, 255, 255, 0.85)',
  whiteAlpha30: 'rgba(255, 255, 255, 0.3)',
  whiteAlpha25: 'rgba(255, 255, 255, 0.25)',
};

export const TYPOGRAPHY = {
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  scale: {
    xxs: { fontSize: 10, lineHeight: 14 },
    badge: { fontSize: 11, lineHeight: 16 },
    xs: { fontSize: 12, lineHeight: 16 },
    navDesktop: { fontSize: 13, lineHeight: 18 },
    sm: { fontSize: 14, lineHeight: 20 },
    smRelaxed: { fontSize: 14, lineHeight: 22.75 },
    base: { fontSize: 16, lineHeight: 24 },
    baseSnug: { fontSize: 16, lineHeight: 24 },
    articleBodyMobile: { fontSize: 16, lineHeight: 30.4 },
    articleBodyDesktop: { fontSize: 17, lineHeight: 32.3 },
    lg: { fontSize: 18, lineHeight: 27 },
    xl: { fontSize: 20, lineHeight: 28 },
    xxl: { fontSize: 24, lineHeight: 34 },
    statValue: { fontSize: 30, lineHeight: 36 },
  },
};

export const Typography = TYPOGRAPHY;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
  // Backwards-compatible tokens used by existing starter components
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

export const Spacing = SPACING;

export const BORDER_RADIUS = {
  sm: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const BorderRadius = BORDER_RADIUS;

export const LAYOUT = {
  navbarMobileHeight: 60,
  navContentsHeight: 48,
  adminNavbarHeight: 64,
  adminSidebarWidth: 256,
  heroAspectRatio: 16 / 9,
  cardThumbnailAspectRatio: 16 / 9,
  galleryPreviewAspectRatio: 16 / 10,
  singlePostMainImageMaxHeight: 580,
  singlePostInlineImageMaxHeight: 230,
  borderWidth: 1,
  dividerWidth: 2,
  footerTopBorderWidth: 4,
};

export const Colors = {
  light: {
    text: COLORS.textPrimary,
    background: COLORS.background,
    backgroundElement: COLORS.backgroundSecondary,
    backgroundSelected: COLORS.red50,
    textSecondary: COLORS.textMeta,
    primary: COLORS.brandRed,
    border: COLORS.borderCard,
  },
  dark: {
    text: COLORS.textPrimary,
    background: COLORS.background,
    backgroundElement: COLORS.backgroundSecondary,
    backgroundSelected: COLORS.red50,
    textSecondary: COLORS.textMeta,
    primary: COLORS.brandRed,
    border: COLORS.borderCard,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  LAYOUT,
  Colors,
  Fonts,
  Spacing,
};
