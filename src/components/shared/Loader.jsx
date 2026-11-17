import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

const SIZE_MAP = {
  sm: { box: 16, indicator: 'small' },
  md: { box: 24, indicator: 'small' },
  lg: { box: 36, indicator: 'large' },
};

export function Loader({ label = 'Loading...', size = 'md', style }) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <View style={[styles.container, style]} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={[styles.indicatorWrap, { width: sizeConfig.box, height: sizeConfig.box }]}>
        <ActivityIndicator size={sizeConfig.indicator} color={COLORS.brandRed} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonThumb} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ArticleSkeleton() {
  return (
    <View style={styles.articleSkeleton}>
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      <View style={[styles.skeletonLine, styles.skeletonTitle]} />
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  indicatorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
    textAlign: 'center',
  },
  skeletonGrid: {
    gap: SPACING.xxl,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  skeletonThumb: {
    width: '100%',
    aspectRatio: LAYOUT.cardThumbnailAspectRatio,
    backgroundColor: COLORS.gray100,
  },
  skeletonBody: {
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  skeletonLine: {
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray100,
    width: '100%',
  },
  skeletonLineShort: {
    width: '35%',
  },
  skeletonLineMedium: {
    width: '72%',
  },
  skeletonTitle: {
    height: 22,
  },
  articleSkeleton: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
});

export default Loader;
