import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function LoginPlaceholderScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
          <ArrowLeft size={16} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Back to A6News</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.badge}>Auth Route Placeholder</Text>
          <Text style={styles.title}>Login Screen (/login)</Text>
          <Text style={styles.subtitle}>
            Authentication form and login logic belong to a later phase.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  backText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  badge: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.scale.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.textMuted,
  },
});
