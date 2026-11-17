import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { BACKEND_URL } from '@/services/api';

export default function IndexScreen() {
  const { token, role, loadingAuth } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>A6NEWS</Text>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>INFRA</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Project Foundation Ready</Text>
          <Text style={styles.description}>
            Phase 1 configuration, theme tokens, Axios API client, and AuthContext are initialized.
          </Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Backend Base URL</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {BACKEND_URL}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Session Status</Text>
            {loadingAuth ? (
              <ActivityIndicator size="small" color={COLORS.brandRed} />
            ) : (
              <Text style={styles.metaValue}>
                {token ? `Authenticated (${role || 'user'})` : 'Guest'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  brandTitle: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  brandBadge: {
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.sm,
  },
  brandBadgeText: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  heading: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  description: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.textMuted,
  },
  divider: {
    height: LAYOUT.borderWidth,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  metaLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMeta,
  },
  metaValue: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
});
