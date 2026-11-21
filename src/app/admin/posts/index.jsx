import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';

import { Loader } from '@/components/shared/Loader';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';
import { formatSlashDate } from '@/utils/formatDate';

const PAGE_LIMIT = 6;

function resolveCategoryName(post) {
  if (post?.category && typeof post.category === 'object' && post.category.name) {
    return String(post.category.name).trim();
  }
  if (typeof post?.category === 'string' && post.category.trim()) {
    return post.category.trim();
  }
  return 'News';
}

function showAndroidToast(message) {
  if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

/**
 * Admin All Posts management screen with pagination and permanent delete confirmation modal.
 */
export default function AdminAllPostsScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [brokenImages, setBrokenImages] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPosts = useCallback(async (targetPage, { isRefresh = false } = {}) => {
    const reqId = ++requestIdRef.current;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await api.get(`/api/posts?limit=${PAGE_LIMIT}&page=${targetPage}`);
      if (!isMountedRef.current || reqId !== requestIdRef.current) {
        return;
      }

      const payload = response?.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      const pagination = payload.pagination || {};
      const nextTotalPosts =
        typeof pagination.totalPosts === 'number'
          ? pagination.totalPosts
          : Number(pagination.totalPosts ?? list.length) || 0;
      const nextTotalPages = Math.max(
        1,
        Number(pagination.totalPages) || Math.ceil(nextTotalPosts / PAGE_LIMIT) || 1
      );

      setPosts(list);
      setTotalPosts(nextTotalPosts);
      setTotalPages(nextTotalPages);
      setBrokenImages({});
    } catch (err) {
      if (!isMountedRef.current || reqId !== requestIdRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load published articles.'
      );
    } finally {
      if (isMountedRef.current && reqId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts(page);
    }, [fetchPosts, page])
  );

  const handlePageChange = (nextPage) => {
    if (loading || refreshing || deleting) {
      return;
    }
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }
    setPage(nextPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openDeleteModal = (post) => {
    if (deleting) {
      return;
    }
    setDeleteTarget(post);
  };

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) {
      return;
    }

    setDeleting(true);
    setError('');
    setFeedback('');

    try {
      const deletedId = deleteTarget.id;
      await api.delete(`/api/posts/${deletedId}`);

      if (!isMountedRef.current) {
        return;
      }

      const remaining = posts.filter((item) => item.id !== deletedId);
      const nextTotalPosts = Math.max(0, totalPosts - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotalPosts / PAGE_LIMIT));

      setPosts(remaining);
      setTotalPosts(nextTotalPosts);
      setTotalPages(nextTotalPages);
      setDeleteTarget(null);
      setFeedback('Post deleted successfully.');
      showAndroidToast('Post deleted successfully.');

      if (remaining.length === 0 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else if (remaining.length === 0 && nextTotalPosts > 0) {
        fetchPosts(1);
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setDeleteTarget(null);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete post.';
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setDeleting(false);
      }
    }
  };

  const markImageBroken = (key) => {
    setBrokenImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  if (loading && !refreshing && posts.length === 0 && !error) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading published articles..." size="lg" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(page, { isRefresh: true })}
            colors={[COLORS.brandRed]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Article Management</Text>
              <Text style={styles.heading}>All Posts</Text>
            </View>

            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalPosts} Total</Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/admin/posts/create')}
            accessibilityRole="button"
            accessibilityLabel="Create New Post"
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          >
            <Plus size={16} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create New Post</Text>
          </Pressable>
        </View>

        {feedback ? (
          <View style={styles.successBanner} accessibilityRole="text">
            <CheckCircle2 size={16} color={COLORS.green700} />
            <Text style={styles.successText}>{feedback}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => fetchPosts(page)}
              accessibilityRole="button"
              accessibilityLabel="Retry loading posts"
              style={({ pressed }) => [styles.retryButton, pressed && styles.neutralButtonPressed]}
            >
              <RefreshCw size={13} color={COLORS.brandRedDark} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && posts.length > 0 ? (
          <Loader label="Refreshing articles..." size="sm" style={styles.inlineLoader} />
        ) : null}

        {!loading && !error && posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Newspaper size={32} color={COLORS.textPlaceholder} />
            <Text style={styles.emptyText}>
              No posts available. Click "Create New Post" to publish your first article.
            </Text>
          </View>
        ) : null}

        {/* Stacked Mobile Cards */}
        {posts.length > 0 ? (
          <View style={styles.cardList}>
            {posts.map((post, idx) => {
              const postKey = String(post?.id ?? post?.slug ?? `post-${idx}`);
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
                        <Newspaper size={26} color={COLORS.textPlaceholder} />
                        <Text style={styles.thumbnailFallbackText}>No Image Available</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.postBody}>
                    <View style={styles.metaRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText} numberOfLines={1}>
                          {categoryName}
                        </Text>
                      </View>

                      {dateLabel ? (
                        <View style={styles.dateRow}>
                          <Calendar size={13} color={COLORS.textPlaceholder} />
                          <Text style={styles.dateText}>{dateLabel}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post?.title || 'Untitled Article'}
                    </Text>

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => canView && router.push(`/posts/${post.slug}`)}
                        disabled={!canView}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${post?.title || 'article'}`}
                        style={({ pressed }) => [
                          styles.viewButton,
                          !canView && styles.buttonDisabled,
                          pressed && canView && styles.neutralButtonPressed,
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
                          !canEdit && styles.buttonDisabled,
                          pressed && canEdit && styles.accentButtonPressed,
                        ]}
                      >
                        <Pencil size={14} color={COLORS.accentBlue} />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => canEdit && openDeleteModal(post)}
                        disabled={!canEdit || deleting}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${post?.title || 'article'}`}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          (!canEdit || deleting) && styles.buttonDisabled,
                          pressed && canEdit && styles.deleteButtonPressed,
                        ]}
                      >
                        <Trash2 size={14} color={COLORS.brandRedDark} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Pagination */}
        {posts.length > 0 || page > 1 ? (
          <View style={styles.paginationBar}>
            <Pressable
              onPress={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading || deleting}
              accessibilityRole="button"
              accessibilityLabel="Previous"
              style={({ pressed }) => [
                styles.pageButton,
                (page <= 1 || loading || deleting) && styles.buttonDisabled,
                pressed && page > 1 && !loading && styles.neutralButtonPressed,
              ]}
            >
              <ChevronLeft size={16} color={COLORS.textSecondary} />
              <Text style={styles.pageButtonText}>Previous</Text>
            </Pressable>

            <Text style={styles.pageIndicator}>
              Page {page} of {totalPages}
            </Text>

            <Pressable
              onPress={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading || deleting}
              accessibilityRole="button"
              accessibilityLabel="Next"
              style={({ pressed }) => [
                styles.pageButton,
                (page >= totalPages || loading || deleting) && styles.buttonDisabled,
                pressed && page < totalPages && !loading && styles.neutralButtonPressed,
              ]}
            >
              <Text style={styles.pageButtonText}>Next</Text>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={Boolean(deleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDeleteModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Delete this post?</Text>
            <Text style={styles.modalDescription}>
              This action is permanent and cannot be undone. The article will be removed from the
              database.
            </Text>

            {deleteTarget?.title ? (
              <Text style={styles.modalTargetTitle} numberOfLines={2}>
                "{deleteTarget.title}"
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeDeleteModal}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  deleting && styles.buttonDisabled,
                  pressed && !deleting && styles.neutralButtonPressed,
                ]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel={deleting ? 'Deleting post' : 'Confirm Delete'}
                style={({ pressed }) => [
                  styles.modalDeleteButton,
                  deleting && styles.buttonDisabled,
                  pressed && !deleting && styles.createButtonPressed,
                ]}
              >
                {deleting ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
                <Text style={styles.modalDeleteText}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    gap: SPACING.md,
  },
  titleRow: {
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
  totalBadge: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  totalBadgeText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRedDark,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  createButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  createButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.successBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  successText: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.green700,
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
  retryText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  inlineLoader: {
    paddingVertical: SPACING.sm,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMeta,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardList: {
    gap: SPACING.md,
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
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
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 40,
    paddingVertical: SPACING.sm,
  },
  viewButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    gap: 5,
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  editButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    gap: 5,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  deleteButtonPressed: {
    backgroundColor: COLORS.red100,
  },
  deleteButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  neutralButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  accentButtonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pageButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  pageIndicator: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  modalHeading: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  modalDescription: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  modalTargetTitle: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.gray50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  modalCancelText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  modalDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  modalDeleteText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
