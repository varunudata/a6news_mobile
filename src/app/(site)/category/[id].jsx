import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';
import { ArticleCard } from '@/components/layout/ArticleCard';
import { Footer } from '@/components/layout/Footer';
import { Loader } from '@/components/shared/Loader';
import { SelectModal } from '@/components/shared/SelectModal';

const SORT_OPTIONS = [
  { label: 'కొత్తవి ముందుగా', value: 'latest' },
  { label: 'పాతవి ముందుగా', value: 'oldest' },
];

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const rawId = Array.isArray(id) ? id[0] : id;

  const scrollRef = useRef(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState({ id: rawId, page: 1, sort: 'latest' });
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activePage = query.id === rawId ? query.page : 1;
  const activeSort = query.id === rawId ? query.sort : 'latest';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCategoryPosts = useCallback(async (categoryId, targetPage, targetSort) => {
    if (!categoryId) {
      setLoading(false);
      setError('Invalid category ID');
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/categories/${categoryId}?page=${targetPage}&sort=${targetSort}`
      );
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;

      const payload = response?.data?.data || {};
      const nextCategory = payload.category || null;
      const nextPosts = Array.isArray(payload.posts) ? payload.posts : [];
      const nextPagination = payload.pagination || {};

      setCategory(nextCategory);
      setPosts(nextPosts);
      setPagination({
        currentPage: Number(nextPagination.currentPage) || targetPage,
        totalPages: Math.max(1, Number(nextPagination.totalPages) || 1),
        totalPosts: Number(nextPagination.totalPosts) || 0,
      });
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setCategory(null);
      setPosts([]);
      setPagination({ currentPage: 1, totalPages: 1, totalPosts: 0 });
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'విభాగం వార్తలు లోడ్ చేయడంలో లోపం ఏర్పడింది.'
      );
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (query.id !== rawId) {
      setQuery({ id: rawId, page: 1, sort: 'latest' });
      return;
    }
    fetchCategoryPosts(rawId, activePage, activeSort);
  }, [rawId, query.id, activePage, activeSort, fetchCategoryPosts]);

  const handleSortChange = (nextSort) => {
    if (!nextSort || nextSort === activeSort) return;
    setQuery({ id: rawId, page: 1, sort: nextSort });
  };

  const handlePageChange = (nextPage) => {
    if (loading) return;
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === activePage) return;
    setQuery({ id: rawId, page: nextPage, sort: activeSort });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const displayCategoryName = category?.name ? String(category.name).toUpperCase() : 'విభాగం';

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.main}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumbRow}>
          <Pressable
            onPress={() => router.push('/')}
            accessibilityRole="link"
            style={({ pressed }) => pressed && styles.pressedOpacity}>
            <Text style={styles.breadcrumbLink}>హోమ్</Text>
          </Pressable>
          <Text style={styles.breadcrumbSep}>/</Text>
          <Text style={styles.breadcrumbMuted}>విభాగం</Text>
          <Text style={styles.breadcrumbSep}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {category?.name || 'విభాగం'}
          </Text>
        </View>

        {/* Category Header */}
        <View style={styles.headerSection}>
          <Text style={styles.eyebrow}>విభాగం వార్తలు</Text>

          <View style={styles.titleRow}>
            <Text style={styles.categoryTitle}>{displayCategoryName}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pagination.totalPosts} కథనాలు</Text>
            </View>
          </View>

          <View style={styles.sortRow}>
            <View style={styles.sortLabelWrap}>
              <SlidersHorizontal size={14} color={COLORS.textMeta} />
              <Text style={styles.sortLabel}>క్రమం:</Text>
            </View>
            <SelectModal
              value={activeSort}
              options={SORT_OPTIONS}
              onValueChange={handleSortChange}
              placeholder="క్రమం ఎంచుకోండి"
              style={styles.sortSelect}
            />
          </View>
        </View>

        {/* Content States */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <Loader label="విభాగం వార్తలు లోడ్ అవుతున్నాయి..." size="lg" />
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Newspaper size={32} color={COLORS.gray400} />
            <Text style={styles.stateHeading}>వార్తలు లోడ్ కాలేదు</Text>
            <Text style={styles.stateDescription}>{error}</Text>
            <View style={styles.stateActions}>
              <Pressable
                onPress={() => fetchCategoryPosts(rawId, activePage, activeSort)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                <RefreshCw size={14} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>మళ్లీ ప్రయత్నించండి</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/')}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}>
                <Text style={styles.secondaryButtonText}>హోమ్ పేజీకి వెళ్ళండి</Text>
              </Pressable>
            </View>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.stateCard}>
            <Newspaper size={32} color={COLORS.gray400} />
            <Text style={styles.stateHeading}>ఈ విభాగంలో ప్రస్తుతం వార్తలు లేవు</Text>
            <Text style={styles.stateDescription}>
              ఇతర విభాగాల వార్తల కోసం పైన ఉన్న మెనూను చూడండి.
            </Text>
            <Pressable
              onPress={() => router.push('/')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>హోమ్ పేజీకి వెళ్ళండి</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.cardList}>
              {posts.map((post, idx) => (
                <ArticleCard
                  key={post.id ?? post.slug ?? `cat-post-${idx}`}
                  post={post}
                  categoryLabel={category?.name || post.category?.name}
                  noImageText="No Image"
                />
              ))}
            </View>

            {/* Pagination Bar */}
            <View style={styles.paginationBar}>
              <Pressable
                onPress={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || loading}
                accessibilityRole="button"
                accessibilityLabel="మునుపటి"
                accessibilityState={{ disabled: pagination.currentPage <= 1 || loading }}
                style={({ pressed }) => [
                  styles.pageButton,
                  (pagination.currentPage <= 1 || loading) && styles.pageButtonDisabled,
                  pressed && pagination.currentPage > 1 && !loading && styles.pageButtonPressed,
                ]}>
                <ChevronLeft
                  size={16}
                  color={
                    pagination.currentPage <= 1 || loading
                      ? COLORS.textPlaceholder
                      : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    (pagination.currentPage <= 1 || loading) && styles.pageButtonTextDisabled,
                  ]}>
                  మునుపటి
                </Text>
              </Pressable>

              <Text style={styles.pageCounterText}>
                పేజీ {pagination.currentPage} / {pagination.totalPages}
              </Text>

              <Pressable
                onPress={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                accessibilityRole="button"
                accessibilityLabel="తదుపరి"
                accessibilityState={{
                  disabled: pagination.currentPage >= pagination.totalPages || loading,
                }}
                style={({ pressed }) => [
                  styles.pageButton,
                  (pagination.currentPage >= pagination.totalPages || loading) &&
                    styles.pageButtonDisabled,
                  pressed &&
                    pagination.currentPage < pagination.totalPages &&
                    !loading &&
                    styles.pageButtonPressed,
                ]}>
                <Text
                  style={[
                    styles.pageButtonText,
                    (pagination.currentPage >= pagination.totalPages || loading) &&
                      styles.pageButtonTextDisabled,
                  ]}>
                  తదుపరి
                </Text>
                <ChevronRight
                  size={16}
                  color={
                    pagination.currentPage >= pagination.totalPages || loading
                      ? COLORS.textPlaceholder
                      : COLORS.textSecondary
                  }
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  main: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  breadcrumbLink: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMeta,
  },
  breadcrumbSep: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textPlaceholder,
  },
  breadcrumbMuted: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
  },
  breadcrumbCurrent: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPlaceholder,
    flexShrink: 1,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  headerSection: {
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.xl,
    borderBottomWidth: LAYOUT.dividerWidth,
    borderBottomColor: COLORS.gray900,
    gap: SPACING.sm,
  },
  eyebrow: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryTitle: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
  },
  countBadgeText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
  sortRow: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  sortLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  sortSelect: {
    flex: 1,
    maxWidth: 220,
  },
  loaderWrap: {
    paddingVertical: SPACING.section,
  },
  stateCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  stateHeading: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  stateDescription: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stateActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    gap: 6,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  cardList: {
    gap: SPACING.xxl,
  },
  paginationBar: {
    marginTop: SPACING.xxl,
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
