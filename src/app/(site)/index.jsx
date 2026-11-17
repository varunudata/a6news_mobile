import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Footer } from '@/components/layout/Footer';

export default function HomePlaceholderScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.body}>
        <View style={styles.placeholderCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PHASE 2 SHELL</Text>
          </View>
          <Text style={styles.title}>A6News Public Layout</Text>
          <Text style={styles.subtitle}>
            Shared Navbar, TickerMarquee, NavContents category navigation, and Footer are mounted.
            Home feed and Hero carousel belong to Phase 3.
          </Text>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  body: {
    padding: SPACING.lg,
  },
  placeholderCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  title: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.textMuted,
  },
});
