import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  Eye,
  FileText,
  FolderKanban,
  Megaphone,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react-native';

import { Loader } from '@/components/shared/Loader';
import { parseTickerText } from '@/components/shared/TickerMarquee';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';
import { formatSlashDate } from '@/utils/formatDate';

function resolveCategoryName(post) {
  if (post?.category && typeof post.category === 'object' && post.category.name) {
    return String(post.category.name).trim();
  }
  if (typeof post?.category === 'string' && post.category.trim()) {
    return post.category.trim();
  }
  return '';
}

function resolveTotalPosts(postsPayload, fallbackCount) {
  const rawTotal = postsPayload?.pagination?.totalPosts;
  if (typeof rawTotal === 'number' && Number.isFinite(rawTotal)) {
    return rawTotal;
  }
  const parsed = Number(rawTotal);
  return Number.isFinite(parsed) && rawTotal !== undefined && rawTotal !== null
    ? parsed
    : fallbackCount;
}

/**
 * Admin CMS Dashboard Overview screen displaying live editorial metrics,
 * quick actions, and recent published dispatches.
 */
export default function AdminDashboardScreen() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const [stats, setStats] = useState({
    totalPosts: 0,
    categoriesCount: 0,
    tickerItemsCount: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [brokenImages, setBrokenImages] = useState({});

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async ({ isRefresh = false } = {}) => {
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
      const [postsRes, categoriesRes, tickerRes] = await Promise.all([
        api.get('/api/posts?limit=5&page=1'),
        api.get('/api/categories'),
        api.get('/api/ticker'),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      const postsPayload = postsRes?.data || {};
      const postsList = Array.isArray(postsPayload.data) ? postsPayload.data.slice(0, 5) : [];
      const totalPosts = resolveTotalPosts(postsPayload, postsList.length);

      const categoriesList = Array.isArray(categoriesRes?.data?.data)
        ? categoriesRes.data.data
        : [];
      const categoriesCount = categoriesList.length;

      const tickerText = tickerRes?.data?.data?.text;
      const tickerItemsCount = parseTickerText(tickerText).length;

      setRecentPosts(postsList);
      setStats({
        totalPosts,
        categoriesCount,
        tickerItemsCount,
      });
      setBrokenImages({});
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unable to load dashboard overview. Please try again.';
      setError(message);
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnceRef.current) {
        fetchDashboardData({ isRefresh: true });
      }
    }, [fetchDashboardData])
  );

  const markImageBroken = (key) => {
    setBrokenImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading dashboard overview..." size="lg" />
      </View>
    );
  }

  if (error && recentPosts.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.errorScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboardData({ isRefresh: true })}
            colors={[COLORS.brandRed]}
          />
        }
      >
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Failed to load dashboard</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            onPress={() => fetchDashboardData()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading dashboard"
            style={({ pressed }) => [styles.retryButton, pressed && styles.primaryButtonPressed]}
          >
            <RefreshCw size={15} color={COLORS.white} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const statCards = [
    {
      label: 'Total Published Reports',
      value: stats.totalPosts,
      href: '/admin/posts',
      icon: FileText,
    },
    {
      label: 'Active Categories',
      value: stats.categoriesCount,
      href: '/admin/categories',
      icon: FolderKanban,
    },
    {
      label: 'Live Ticker Headlines',
      value: stats.tickerItemsCount,
      href: '/admin/ticker',
      icon: Megaphone,
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDashboardData({ isRefresh: true })}
          colors={[COLORS.brandRed]}
        />
      }
    >
      {/* Header & Quick Actions */}
      <View style={styles.headerSection}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Editorial Control Center</Text>
          <Text style={styles.heading}>Dashboard Overview</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={() => router.push('/admin/posts/create')}
            accessibilityRole="button"
            accessibilityLabel="Create New Post"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Plus size={16} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Create New Post</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/admin/ticker')}
            accessibilityRole="button"
            accessibilityLabel="Update Ticker"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Megaphone size={15} color={COLORS.accentBlue} />
            <Text style={styles.secondaryButtonText}>Update Ticker</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.inlineErrorBanner}>
          <Text style={styles.inlineErrorText} numberOfLines={2}>
            {error}
          </Text>
          <Pressable
            onPress={() => fetchDashboardData({ isRefresh: true })}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={({ pressed }) => [styles.inlineRetry, pressed && styles.secondaryButtonPressed]}
          >
            <RefreshCw size={13} color={COLORS.brandRedDark} />
            <Text style={styles.inlineRetryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Statistics Cards */}
      <View style={styles.statsSection}>
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Pressable
              key={card.href}
              onPress={() => router.push(card.href)}
              accessibilityRole="button"
              accessibilityLabel={`${card.label}: ${card.value}`}
              style={({ pressed }) => [styles.statCard, pressed && styles.cardPressed]}
            >
              <View style={styles.statTopRow}>
                <View style={styles.statIconWrap}>
                  <IconComponent size={20} color={COLORS.brandRed} />
                </View>

                <View style={styles.managePill}>
                  <Text style={styles.manageText}>Manage</Text>
                  <ArrowRight size={13} color={COLORS.accentBlue} />
                </View>
              </View>

              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Recent Dispatches */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <View style={styles.recentHeaderText}>
            <Text style={styles.sectionTitle}>Recent Dispatches</Text>
            <Text style={styles.sectionSubtitle}>Latest 5 articles published on A6News</Text>
          </View>

          <Pressable
            onPress={() => router.push('/admin/posts')}
            accessibilityRole="button"
            accessibilityLabel={`View All (${stats.totalPosts})`}
            style={({ pressed }) => [styles.viewAllButton, pressed && styles.secondaryButtonPressed]}
          >
            <Text style={styles.viewAllText}>View All ({stats.totalPosts})</Text>
            <ArrowRight size={14} color={COLORS.accentBlue} />
          </Pressable>
        </View>

        {recentPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Newspaper size={28} color={COLORS.textPlaceholder} />
            <Text style={styles.emptyText}>No posts published yet.</Text>
          </View>
        ) : (
          <View style={styles.postList}>
            {recentPosts.map((post, idx) => {
              const postKey = String(post?.id ?? post?.slug ?? `recent-${idx}`);
              const categoryName = resolveCategoryName(post);
              const dateLabel = formatSlashDate(post?.createdAt);
              const hasThumbnail = Boolean(post?.thumbnail) && !brokenImages[postKey];
              const canView = Boolean(post?.slug);
              const canEdit = post?.id !== undefined && post?.id !== null;

              return (
                <View key={postKey} style={styles.postCard}>
                  <View style={styles.thumbnailBox}>
                    {hasThumbnail ? (
                      <Image
                        source={{ uri: post.thumbnail }}
                        style={styles.thumbnailImage}
                        resizeMode="contain"
                        onError={() => markImageBroken(postKey)}
                      />
                    ) : (
                      <View style={styles.thumbnailFallback}>
                        <Newspaper size={24} color={COLORS.textPlaceholder} />
                        <Text style={styles.thumbnailFallbackText}>No Image Available</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.postBody}>
                    <View style={styles.postMetaRow}>
                      {categoryName ? (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText} numberOfLines={1}>
                            {categoryName}
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}

                      {dateLabel ? (
                        <View style={styles.dateRow}>
                          <Calendar size={13} color={COLORS.textPlaceholder} />
                          <Text style={styles.dateText}>{dateLabel}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post?.title || 'Untitled Report'}
                    </Text>

                    <View style={styles.postActionsRow}>
                      <Pressable
                        onPress={() => canView && router.push(`/posts/${post.slug}`)}
                        disabled={!canView}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${post?.title || 'article'}`}
                        style={({ pressed }) => [
                          styles.viewButton,
                          !canView && styles.actionDisabled,
                          pressed && canView && styles.secondaryButtonPressed,
                        ]}
                      >
                        <Eye size={14} color={COLORS.textSecondary} />
                        <Text style={styles.viewButtonText}>View</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => canEdit && router.push(`/admin/posts/edit/${post.id}`)}
                        disabled={!canEdit}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${post?.title || 'article'}`}
                        style={({ pressed }) => [
                          styles.editButton,
                          !canEdit && styles.actionDisabled,
                          pressed && canEdit && styles.editButtonPressed,
                        ]}
                      >
                        <Pencil size={14} color={COLORS.accentBlue} />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    gap: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  errorScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.backgroundSecondary,
  },
  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  errorMessage: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  inlineErrorBanner: {
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
  inlineErrorText: {
    flex: 1,
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  inlineRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  inlineRetryText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  headerSection: {
    gap: SPACING.md,
  },
  titleBlock: {
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  statsSection: {
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  cardPressed: {
    backgroundColor: COLORS.gray50,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
  },
  manageText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  statValue: {
    ...TYPOGRAPHY.scale.statValue,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMuted,
  },
  recentSection: {
    gap: SPACING.md,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  recentHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  viewAllText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  postList: {
    gap: SPACING.md,
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
  },
  thumbnailBox: {
    width: '100%',
    aspectRatio: LAYOUT.cardThumbnailAspectRatio,
    backgroundColor: COLORS.thumbnailBackdrop,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  thumbnailFallbackText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textPlaceholder,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  postBody: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    maxWidth: '65%',
  },
  categoryBadgeText: {
    ...TYPOGRAPHY.scale.badge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  postTitle: {
    ...TYPOGRAPHY.scale.baseSnug,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  postActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  viewButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    gap: 6,
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  actionDisabled: {
    opacity: 0.5,
  },
});
