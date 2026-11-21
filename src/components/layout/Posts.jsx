import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';
import { ArticleCard } from '@/components/layout/ArticleCard';
import { Loader } from '@/components/shared/Loader';

export function Posts({ scrollRef, refreshSignal = 0, onRefreshDone }) {
  const postsContainerYRef = useRef(0);
  const latestSectionYRef = useRef(0);
  const isMountedRef = useRef(true);
  const recentRequestIdRef = useRef(0);
  const pageRef = useRef(1);
  const lastHandledRefreshRef = useRef(0);
  const onRefreshDoneRef = useRef(onRefreshDone);
  onRefreshDoneRef.current = onRefreshDone;

  // Section 1: Top 6 Stories by Category
  const [topPosts, setTopPosts] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [errorTop, setErrorTop] = useState(null);

  // Section 2: Paginated Latest Reports
  const [recentPosts, setRecentPosts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [errorRecent, setErrorRecent] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  pageRef.current = page;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTopPosts = useCallback(async () => {
    setLoadingTop(true);
    setErrorTop(null);
    try {
      const response = await api.get('/api/posts/latest-per-category');
      const raw = Array.isArray(response?.data?.data) ? response.data.data : [];
      const sorted = [...raw]
        .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
        .slice(0, 6);

      if (isMountedRef.current) {
        setTopPosts(sorted);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setTopPosts([]);
        setErrorTop(error?.message || 'Failed to load top category stories');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingTop(false);
      }
    }
  }, []);

  const fetchRecentPosts = useCallback(async (targetPage) => {
    const requestId = ++recentRequestIdRef.current;
    setLoadingRecent(true);
    setErrorRecent(null);

    try {
      const response = await api.get(`/api/posts?limit=6&page=${targetPage}`);
      if (!isMountedRef.current || requestId !== recentRequestIdRef.current) return;

      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      const serverTotalPages = Number(response?.data?.pagination?.totalPages) || 1;

      setRecentPosts(list);
      setTotalPages(Math.max(1, serverTotalPages));
    } catch (error) {
      if (!isMountedRef.current || requestId !== recentRequestIdRef.current) return;
      setRecentPosts([]);
      setErrorRecent(error?.message || 'Failed to load latest reports');
    } finally {
      if (isMountedRef.current && requestId === recentRequestIdRef.current) {
        setLoadingRecent(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTopPosts();
  }, [fetchTopPosts]);

  useEffect(() => {
    fetchRecentPosts(page);
  }, [fetchRecentPosts, page]);

  useEffect(() => {
    if (!refreshSignal || refreshSignal === lastHandledRefreshRef.current) {
      return;
    }
    lastHandledRefreshRef.current = refreshSignal;
    let active = true;
    Promise.all([fetchTopPosts(), fetchRecentPosts(pageRef.current)]).finally(() => {
      if (active && isMountedRef.current) {
        onRefreshDoneRef.current?.();
      }
    });
    return () => {
      active = false;
    };
  }, [refreshSignal, fetchTopPosts, fetchRecentPosts]);

  const handlePageChange = (nextPage) => {
    if (loadingRecent) return;
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;

    setPage(nextPage);

    const targetY = Math.max(0, postsContainerYRef.current + latestSectionYRef.current);
    scrollRef?.current?.scrollTo({ y: targetY, animated: true });
  };

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        postsContainerYRef.current = event.nativeEvent.layout.y;
      }}>
      {/* Section 1: Top 6 Stories by Category */}
      <View style={styles.topSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.eyebrow}>విభాగాల వారీగా</Text>
          <Text style={styles.heading}>ప్రధాన విభాగాల తాజా వార్తలు</Text>
          <Text style={styles.subtitle}>
            వివిధ మౌలిక సదుపాయాల రంగాల నుండి ఎంపిక చేసిన 6 తాజా కథనాలు
          </Text>
        </View>

        {loadingTop ? (
          <Loader label="వార్తలు లోడ్ అవుతున్నాయి..." size="lg" />
        ) : errorTop ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>ప్రస్తుతం వార్తలు అందుబాటులో లేవు.</Text>
            <Pressable
              onPress={fetchTopPosts}
              accessibilityRole="button"
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
              <RefreshCw size={14} color={COLORS.white} />
              <Text style={styles.retryButtonText}>మళ్లీ ప్రయత్నించండి</Text>
            </Pressable>
          </View>
        ) : topPosts.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>ప్రస్తుతం వార్తలు అందుబాటులో లేవు.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {topPosts.map((post, idx) => (
              <ArticleCard
                key={post.id ?? post.slug ?? `top-${idx}`}
                post={post}
                categoryLabel={post.category}
              />
            ))}
          </View>
        )}
      </View>

      {/* Section 2: Latest Reports (Paginated) */}
      <View
        style={styles.latestSection}
        onLayout={(event) => {
          latestSectionYRef.current = event.nativeEvent.layout.y;
        }}>
        <View style={styles.latestHeader}>
          <View style={styles.latestHeaderLeft}>
            <Text style={styles.eyebrow}>తాజా అప్‌డేట్స్</Text>
            <Text style={styles.heading}>ఇటీవలి వార్తలు &amp; కథనాలు</Text>
          </View>
          <View style={styles.pagePill}>
            <Text style={styles.pagePillText}>
              పేజీ {page} / {totalPages}
            </Text>
          </View>
        </View>

        {loadingRecent ? (
          <Loader label="వార్తలు లోడ్ అవుతున్నాయి..." size="lg" />
        ) : errorRecent ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>ప్రస్తుతం వార్తలు అందుబాటులో లేవు.</Text>
            <Pressable
              onPress={() => fetchRecentPosts(page)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
              <RefreshCw size={14} color={COLORS.white} />
              <Text style={styles.retryButtonText}>మళ్లీ ప్రయత్నించండి</Text>
            </Pressable>
          </View>
        ) : recentPosts.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>ప్రస్తుతం వార్తలు అందుబాటులో లేవు.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {recentPosts.map((post, idx) => (
              <ArticleCard
                key={post.id ?? post.slug ?? `recent-${idx}`}
                post={post}
                categoryLabel={post.category?.name}
              />
            ))}
          </View>
        )}

        {/* Pagination Controls */}
        <View style={styles.paginationBar}>
          <Pressable
            onPress={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loadingRecent}
            accessibilityRole="button"
            accessibilityLabel="మునుపటి"
            accessibilityState={{ disabled: page <= 1 || loadingRecent }}
            style={({ pressed }) => [
              styles.pageButton,
              (page <= 1 || loadingRecent) && styles.pageButtonDisabled,
              pressed && page > 1 && !loadingRecent && styles.pageButtonPressed,
            ]}>
            <ChevronLeft
              size={16}
              color={page <= 1 || loadingRecent ? COLORS.textPlaceholder : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.pageButtonText,
                (page <= 1 || loadingRecent) && styles.pageButtonTextDisabled,
              ]}>
              మునుపటి
            </Text>
          </Pressable>

          <Text style={styles.pageCounterText}>
            పేజీ {page} / {totalPages}
          </Text>

          <Pressable
            onPress={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loadingRecent}
            accessibilityRole="button"
            accessibilityLabel="తదుపరి"
            accessibilityState={{ disabled: page >= totalPages || loadingRecent }}
            style={({ pressed }) => [
              styles.pageButton,
              (page >= totalPages || loadingRecent) && styles.pageButtonDisabled,
              pressed && page < totalPages && !loadingRecent && styles.pageButtonPressed,
            ]}>
            <Text
              style={[
                styles.pageButtonText,
                (page >= totalPages || loadingRecent) && styles.pageButtonTextDisabled,
              ]}>
              తదుపరి
            </Text>
            <ChevronRight
              size={16}
              color={
                page >= totalPages || loadingRecent ? COLORS.textPlaceholder : COLORS.textSecondary
              }
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: COLORS.white,
  },
  topSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xl,
    borderBottomWidth: LAYOUT.dividerWidth,
    borderBottomColor: COLORS.gray900,
    gap: SPACING.xs,
  },
  latestSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: LAYOUT.borderWidth,
    borderBottomWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
  },
  latestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xl,
    borderBottomWidth: LAYOUT.dividerWidth,
    borderBottomColor: COLORS.gray900,
    gap: SPACING.md,
  },
  latestHeaderLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  eyebrow: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heading: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMeta,
  },
  pagePill: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
  },
  pagePillText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  cardList: {
    gap: SPACING.lg,
  },
  stateCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  stateText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  retryButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  retryButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  paginationBar: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  pageButtonDisabled: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.borderCard,
  },
  pageButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  pageButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  pageButtonTextDisabled: {
    color: COLORS.textPlaceholder,
  },
  pageCounterText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
});

export default Posts;
