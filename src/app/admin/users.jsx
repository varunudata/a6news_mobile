import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RefreshCw, Search, ShieldCheck, User, Users, X } from 'lucide-react-native';

import { Loader } from '@/components/shared/Loader';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

/**
 * Read-only Admin Users directory screen (/admin/users) backed by GET /api/auth/users.
 */
export default function AdminUsersScreen() {
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async ({ isRefresh = false } = {}) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await api.get('/api/auth/users');
      if (!isMountedRef.current) {
        return;
      }

      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setUsers(list);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch user accounts.'
      );
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const trimmedSearch = search.trim();
  const filteredUsers = useMemo(() => {
    if (!trimmedSearch) {
      return users;
    }
    const query = trimmedSearch.toLowerCase();
    return users.filter(
      (u) =>
        String(u?.username || '').toLowerCase().includes(query) ||
        String(u?.role || '').toLowerCase().includes(query) ||
        String(u?.id ?? '').includes(query)
    );
  }, [users, trimmedSearch]);

  if (loading && !refreshing && users.length === 0 && !error) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading user accounts..." size="lg" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchUsers({ isRefresh: true })}
          colors={[COLORS.brandRed]}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Access Control</Text>
          <Text style={styles.heading}>Registered Users ({users.length})</Text>
        </View>

        <View style={styles.readOnlyBadge}>
          <Text style={styles.readOnlyText}>Read Only</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => fetchUsers()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading users"
            style={({ pressed }) => [styles.retryButton, pressed && styles.neutralPressed]}
          >
            <RefreshCw size={13} color={COLORS.brandRedDark} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={17} color={COLORS.textPlaceholder} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users by username or role..."
          placeholderTextColor={COLORS.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {trimmedSearch ? (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear user search"
            style={styles.clearButton}
          >
            <X size={16} color={COLORS.textMeta} />
          </Pressable>
        ) : null}
      </View>

      {/* Users List */}
      {users.length === 0 && !error ? (
        <View style={styles.emptyCard}>
          <Users size={30} color={COLORS.textPlaceholder} />
          <Text style={styles.emptyText}>No registered users found.</Text>
        </View>
      ) : filteredUsers.length === 0 && !error ? (
        <View style={styles.emptyCard}>
          <Users size={30} color={COLORS.textPlaceholder} />
          <Text style={styles.emptyText}>No matching users found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredUsers.map((account, idx) => {
            const isAdmin = String(account?.role || '').toLowerCase() === 'admin';
            return (
              <View key={String(account?.id ?? idx)} style={styles.userCard}>
                <View style={styles.userLeft}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{account?.id ?? idx + 1}</Text>
                  </View>

                  <View style={styles.avatarCircle}>
                    <User size={16} color={COLORS.textMuted} />
                  </View>

                  <Text style={styles.username} numberOfLines={1}>
                    {account?.username || 'Unknown User'}
                  </Text>
                </View>

                {isAdmin ? (
                  <View style={styles.adminRoleBadge}>
                    <ShieldCheck size={13} color={COLORS.brandRed} />
                    <Text style={styles.adminRoleText}>Admin</Text>
                  </View>
                ) : (
                  <View style={styles.userRoleBadge}>
                    <Text style={styles.userRoleText}>{account?.role || 'user'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heading: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  readOnlyBadge: {
    backgroundColor: COLORS.gray100,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  readOnlyText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  errorText: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  neutralPressed: {
    backgroundColor: COLORS.gray100,
  },
  retryText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    padding: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  list: {
    gap: SPACING.sm,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  userLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  idBadge: {
    backgroundColor: COLORS.gray100,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idBadgeText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  adminRoleText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
  userRoleBadge: {
    backgroundColor: COLORS.gray100,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  userRoleText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
});
