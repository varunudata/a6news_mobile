import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

/**
 * Phase 5 authenticated Admin entry screen.
 * Confirms verified admin session and provides logout and return-to-site controls.
 */
export default function AdminDashboardPlaceholderScreen() {
  const router = useRouter();
  const { role, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      // Leave /admin before clearing auth state so AdminLayout does not race to /login.
      if (typeof router.canDismiss === 'function' && router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <ShieldCheck size={14} color={COLORS.brandRed} />
          <Text style={styles.badgeText}>Admin Portal</Text>
        </View>

        <Text style={styles.title}>A6 News Editorial Admin</Text>
        <Text style={styles.subtitle}>
          Signed in with verified {role || 'admin'} access. Full CMS dashboard, post publishing,
          category, ticker, and user management screens are scheduled for upcoming phases.
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            style={({ pressed }) => [
              styles.logoutButton,
              loggingOut && styles.buttonDisabled,
              pressed && !loggingOut && styles.logoutButtonPressed,
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <LogOut size={16} color={COLORS.white} />
            )}
            <Text style={styles.logoutButtonText}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/')}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Back to Live Website"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <ArrowLeft size={16} color={COLORS.textSecondary} />
            <Text style={styles.secondaryButtonText}>Back to Live Website</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.backgroundSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...TYPOGRAPHY.scale.xl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  actions: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.brandRed,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 46,
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 46,
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
});
