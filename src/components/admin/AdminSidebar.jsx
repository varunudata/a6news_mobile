import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  Users,
  X,
} from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

export const ADMIN_NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/admin',
  },
  {
    label: 'All Posts',
    href: '/admin/posts',
    icon: FileText,
    match: (pathname) => pathname === '/admin/posts' || pathname.startsWith('/admin/posts/edit'),
  },
  {
    label: 'Create Post',
    href: '/admin/posts/create',
    icon: PlusCircle,
    match: (pathname) => pathname === '/admin/posts/create',
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: FolderKanban,
    match: (pathname) =>
      pathname === '/admin/categories' || pathname.startsWith('/admin/categories/'),
  },
  {
    label: 'News Ticker',
    href: '/admin/ticker',
    icon: Megaphone,
    match: (pathname) => pathname === '/admin/ticker' || pathname.startsWith('/admin/ticker/'),
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    match: (pathname) => pathname === '/admin/users' || pathname.startsWith('/admin/users/'),
  },
];

/**
 * Slide-over modal drawer providing navigation across Admin CMS sections.
 */
export function AdminSidebar({ isOpen = false, onClose }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const currentYear = new Date().getFullYear();

  const handleNavigate = (href) => {
    onClose?.();
    if (pathname !== href) {
      router.push(href);
    }
  };

  return (
    <Modal
      visible={Boolean(isOpen)}
      transparent
      animationType="fade"
      onRequestClose={() => onClose?.()}
    >
      <View style={styles.overlay}>
        <Pressable
          onPress={() => onClose?.()}
          accessibilityRole="button"
          accessibilityLabel="Close navigation drawer"
          style={styles.backdrop}
        />

        <View style={styles.drawer}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  <Text style={styles.headerBrandRed}>A6</Text>
                  <Text style={styles.headerBrandDark}>News Editorial</Text>
                </Text>
                <Text style={styles.headerSubtitle}>Admin CMS</Text>
              </View>

              <Pressable
                onPress={() => onClose?.()}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <X size={20} color={COLORS.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.navScroll}
              contentContainerStyle={styles.navList}
              showsVerticalScrollIndicator={false}
            >
              {ADMIN_NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = item.match(pathname);

                return (
                  <Pressable
                    key={item.href}
                    onPress={() => handleNavigate(item.href)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isActive }}
                    style={({ pressed }) => [
                      styles.navItem,
                      isActive && styles.navItemActive,
                      pressed && !isActive && styles.navItemPressed,
                    ]}
                  >
                    <IconComponent
                      size={18}
                      color={isActive ? COLORS.white : COLORS.textMuted}
                    />
                    <Text
                      style={[styles.navItemText, isActive && styles.navItemTextActive]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerTitle}>A6News Infra CMS</Text>
              <Text style={styles.footerCopy}>© {currentYear} All Rights Reserved</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

export default AdminSidebar;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.modalBackdrop,
  },
  drawer: {
    width: LAYOUT.adminSidebarWidth,
    height: '100%',
    backgroundColor: COLORS.white,
    borderRightWidth: LAYOUT.borderWidth,
    borderRightColor: COLORS.borderCard,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    ...TYPOGRAPHY.scale.baseSnug,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
  },
  headerBrandRed: {
    color: COLORS.brandRed,
  },
  headerBrandDark: {
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  navScroll: {
    flex: 1,
  },
  navList: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
  },
  navItemActive: {
    backgroundColor: COLORS.brandRed,
  },
  navItemPressed: {
    backgroundColor: COLORS.gray100,
  },
  navItemText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  navItemTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  footer: {
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.borderCard,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 2,
  },
  footerTitle: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  footerCopy: {
    ...TYPOGRAPHY.scale.xxs,
    color: COLORS.textMeta,
  },
});
