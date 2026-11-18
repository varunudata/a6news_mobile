import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/components/shared/Loader';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isTokenExpired } from '@/utils/auth';

/**
 * Protected route guard wrapping all /admin screens.
 * Waits for session hydration and allows access only to authenticated admin users.
 */
export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { token, role, loadingAuth, logout } = useAuth();

  const isOnAdminRoute = segments[0] === 'admin';
  const hasValidToken = Boolean(token) && !isTokenExpired(token);
  const isAuthorized = !loadingAuth && hasValidToken && role === 'admin';

  useEffect(() => {
    if (loadingAuth || !isOnAdminRoute) {
      return;
    }

    let cancelled = false;

    const verifyAdminAccess = async () => {
      if (!hasValidToken) {
        if (token || role) {
          await logout();
        }
        if (!cancelled) {
          router.replace('/login');
        }
        return;
      }

      if (role !== 'admin') {
        await logout();
        if (!cancelled) {
          router.replace('/');
        }
      }
    };

    verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [loadingAuth, isOnAdminRoute, hasValidToken, token, role, logout, router]);

  if (loadingAuth || !isAuthorized) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Loader label="Verifying admin access..." size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
});
