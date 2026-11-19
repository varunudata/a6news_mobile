import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

import { PostForm } from '@/components/admin/PostForm';
import { Loader } from '@/components/shared/Loader';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

function showAndroidToast(message) {
  if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

function mapPostToFormValues(post) {
  const formattedTags = Array.isArray(post?.tags)
    ? post.tags.join(', ')
    : typeof post?.tags === 'string'
      ? post.tags
      : '';

  return {
    postId: post?.id,
    title: post?.title || '',
    categoryId: post?.categoryId ?? post?.category?.id ?? '',
    categoryName: post?.category?.name || (typeof post?.category === 'string' ? post.category : ''),
    subtitle: post?.subtitle || '',
    content: post?.content || '',
    tags: formattedTags,
    youtubeLink: post?.youtubeLink || '',
    thumbnail: post?.thumbnail || '',
    gallery: Array.isArray(post?.gallery) ? post.gallery.filter(Boolean) : [],
  };
}

/**
 * Admin Edit Post screen fetching GET /api/posts/id/${id} and submitting PUT /api/posts/${id}.
 */
export default function AdminEditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isMountedRef = useRef(true);

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const postId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setError('Invalid post ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/posts/id/${postId}`);
      if (!isMountedRef.current) {
        return;
      }

      const postData = response?.data?.data;
      if (!postData) {
        setError('Post not found.');
        return;
      }

      setInitialValues(mapPostToFormValues(postData));
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch article details.'
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleUpdate = async (payload) => {
    if (submitting || !postId) {
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    try {
      await api.put(`/api/posts/${postId}`, payload);
      const msg = 'Post updated successfully.';
      setSuccessMessage(msg);
      showAndroidToast(msg);
      router.replace('/admin/posts');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unable to update post.';
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading article details..." size="lg" />
      </View>
    );
  }

  if (error || !initialValues) {
    return (
      <ScrollView contentContainerStyle={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to load article</Text>
          <Text style={styles.errorMessage}>{error || 'Post not found.'}</Text>

          <View style={styles.errorActions}>
            <Pressable
              onPress={fetchPost}
              accessibilityRole="button"
              accessibilityLabel="Retry loading post"
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <RefreshCw size={15} color={COLORS.white} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/admin/posts')}
              accessibilityRole="button"
              accessibilityLabel="Back to All Posts"
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <ArrowLeft size={15} color={COLORS.textSecondary} />
              <Text style={styles.backButtonText}>Back to All Posts</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <PostForm
      key={String(postId)}
      mode="edit"
      initialValues={initialValues}
      submitting={submitting}
      successMessage={successMessage}
      onSubmit={handleUpdate}
      onCancel={() => router.replace('/admin/posts')}
    />
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  errorContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.backgroundSecondary,
  },
  errorCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.xl,
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
  errorActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  retryButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  backButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
});
