import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Newspaper } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

/**
 * Branded unmatched-route screen returning readers safely to the public homepage.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Newspaper size={32} color={COLORS.brandRed} />
          </View>

          <Text style={styles.code}>404</Text>
          <Text style={styles.heading}>ఈ పేజీ అందుబాటులో లేదు</Text>
          <Text style={styles.description}>
            మీరు కోరిన పేజీ కనుగొనబడలేదు లేదా తొలగించబడి ఉండవచ్చు.
          </Text>

          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="హోమ్ పేజీకి వెళ్ళండి"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <ArrowLeft size={16} color={COLORS.white} />
            <Text style={styles.buttonText}>హోమ్ పేజీకి వెళ్ళండి</Text>
          </Pressable>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    ...TYPOGRAPHY.scale.statValue,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.brandRed,
  },
  heading: {
    ...TYPOGRAPHY.scale.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  buttonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  buttonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
