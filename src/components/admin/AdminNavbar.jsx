import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ExternalLink, LogOut, Menu } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

/**
 * Top navigation header rendered across all protected /admin routes.
 */
export function AdminNavbar({ onOpenSidebar }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      // Leave /admin before clearing session so AdminLayout does not bounce to /login.
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
      <View style={styles.leftGroup}>
        <Pressable
          onPress={onOpenSidebar}
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
          style={({ pressed }) => [styles.menuButton, pressed && styles.neutralButtonPressed]}
        >
          <Menu size={20} color={COLORS.textSecondary} />
        </Pressable>

        <View style={styles.brandGroup}>
          <Text style={styles.brandText} numberOfLines={1}>
            <Text style={styles.brandRed}>A6</Text>
            <Text style={styles.brandDark}>News</Text>
          </Text>

          <View style={styles.cmsBadge}>
            <Text style={styles.cmsBadgeText} numberOfLines={1}>
              Admin CMS
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightGroup}>
        <Pressable
          onPress={() => router.push('/')}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Live Website"
          style={({ pressed }) => [
            styles.liveSiteButton,
            pressed && !loggingOut && styles.neutralButtonPressed,
          ]}
        >
          <ExternalLink size={14} color={COLORS.textSecondary} />
          <Text style={styles.liveSiteText} numberOfLines={1}>
            Live Website
          </Text>
        </Pressable>

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
            <LogOut size={14} color={COLORS.white} />
          )}
          <Text style={styles.logoutText} numberOfLines={1}>
            Logout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default AdminNavbar;

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.adminNavbarHeight,
    backgroundColor: COLORS.white,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  brandText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  brandRed: {
    color: COLORS.brandRed,
  },
  brandDark: {
    color: COLORS.textPrimary,
  },
  cmsBadge: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cmsBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveSiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
  },
  neutralButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  liveSiteText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
