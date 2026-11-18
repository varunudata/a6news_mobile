import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Slot, usePathname, useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader } from '@/components/shared/Loader';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isTokenExpired } from '@/utils/auth';

/**
 * Protected route guard and persistent CMS chrome wrapping all /admin screens.
 * Waits for session hydration and renders admin navigation only for verified admins.
 */
export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { token, role, loadingAuth, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOnAdminRoute = segments[0] === 'admin';
  const hasValidToken = Boolean(token) && !isTokenExpired(token);
  const isAuthorized = !loadingAuth && hasValidToken && role === 'admin';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundSecondary} />
        <Loader label="Verifying admin access..." size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <AdminNavbar onOpenSidebar={() => setSidebarOpen(true)} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingSafeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
});
