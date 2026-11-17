import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Footer } from '@/components/layout/Footer';

export default function PostPlaceholderScreen() {
  const { slug } = useLocalSearchParams();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ROUTE PLACEHOLDER</Text>
          <Text style={styles.title}>Post Route: /posts/{String(slug || '')}</Text>
          <Text style={styles.subtitle}>
            Article detail implementation belongs to a later phase.
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
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  eyebrow: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
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
