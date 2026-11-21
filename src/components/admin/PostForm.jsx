import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react-native';

import { GalleryImagePicker } from '@/components/admin/GalleryImagePicker';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SelectModal } from '@/components/shared/SelectModal';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

function parseTags(tagsInput) {
  return tagsInput
    ? String(tagsInput)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
}

/**
 * Shared article creation & editing form used by /admin/posts/create and /admin/posts/edit/[id].
 */
export function PostForm({
  mode = 'create',
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
  successMessage = '',
}) {
  const isMountedRef = useRef(true);

  const [title, setTitle] = useState(initialValues?.title || '');
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId !== undefined && initialValues?.categoryId !== null
      ? initialValues.categoryId
      : ''
  );
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle || '');
  const [content, setContent] = useState(initialValues?.content || '');
  const [tags, setTags] = useState(initialValues?.tags || '');
  const [youtubeLink, setYoutubeLink] = useState(initialValues?.youtubeLink || '');
  const [thumbnail, setThumbnail] = useState(initialValues?.thumbnail || '');
  const [gallery, setGallery] = useState(
    Array.isArray(initialValues?.gallery) ? initialValues.gallery : []
  );

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError('');

    try {
      const response = await api.get('/api/categories');
      if (!isMountedRef.current) {
        return;
      }
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(list);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setCategoryError(
        err?.response?.data?.message || err?.message || 'Unable to load categories.'
      );
    } finally {
      if (isMountedRef.current) {
        setLoadingCategories(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryOptions = useMemo(() => {
    const options = categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
    }));

    if (
      initialValues?.categoryId &&
      initialValues?.categoryName &&
      !options.some((opt) => String(opt.value) === String(initialValues.categoryId))
    ) {
      options.unshift({
        label: initialValues.categoryName,
        value: initialValues.categoryId,
      });
    }

    return options;
  }, [categories, initialValues?.categoryId, initialValues?.categoryName]);

  const isUploadingMedia = uploadingThumbnail || uploadingGallery;
  const isBusy = submitting || isUploadingMedia;

  const handleSubmit = async () => {
    if (isBusy) {
      return;
    }

    const missing = [];
    if (!title.trim()) missing.push('Title');
    if (!categoryId) missing.push('Category');
    if (!content.trim()) missing.push('Article Content');
    if (!thumbnail) missing.push('Main Thumbnail');

    if (!title.trim() || !content.trim() || !categoryId || !thumbnail) {
      setFormError(`Please complete required fields: ${missing.join(', ')}.`);
      return;
    }

    setFormError('');

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      content: content.trim(),
      categoryId: Number(categoryId),
      tags: parseTags(tags),
      thumbnail: String(thumbnail).trim(),
      youtubeLink: youtubeLink.trim(),
      gallery: Array.isArray(gallery) ? gallery.filter(Boolean) : [],
    };

    try {
      await onSubmit?.(payload);
    } catch (err) {
      if (isMountedRef.current) {
        setFormError(err?.message || 'Failed to save post. Please try again.');
      }
    }
  };

  const isEdit = mode === 'edit';
  const submitLabel = isEdit
    ? submitting
      ? 'Updating...'
      : 'Update Post'
    : submitting
      ? 'Publishing...'
      : 'Publish Post';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={onCancel}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Back to All Posts"
          style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
        >
          <ArrowLeft size={16} color={COLORS.textMuted} />
          <Text style={styles.backLinkText}>Back to All Posts</Text>
        </Pressable>

        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>{isEdit ? 'Editorial Update' : 'Editorial Publishing'}</Text>
          <Text style={styles.heading}>{isEdit ? 'Edit Post' : 'Create New Post'}</Text>
        </View>

        {successMessage ? (
          <View style={styles.successBanner} accessibilityRole="text">
            <CheckCircle2 size={16} color={COLORS.green700} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {formError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {/* 1. Title * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (formError) setFormError('');
              }}
              placeholder="Enter headline..."
              placeholderTextColor={COLORS.textPlaceholder}
              editable={!submitting}
              style={styles.input}
            />
          </View>

          {/* 2. Category * */}
          <View style={styles.fieldGroup}>
            <SelectModal
              label="Category *"
              value={categoryId}
              options={categoryOptions}
              onValueChange={(val) => {
                setCategoryId(val);
                if (formError) setFormError('');
              }}
              placeholder={loadingCategories ? 'Loading categories...' : 'Select Category'}
              disabled={submitting || (loadingCategories && categoryOptions.length === 0)}
            />

            {categoryError ? (
              <View style={styles.categoryErrorRow}>
                <Text style={styles.categoryErrorText}>{categoryError}</Text>
                <Pressable
                  onPress={fetchCategories}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading categories"
                  style={styles.retryInline}
                >
                  <RefreshCw size={12} color={COLORS.brandRedDark} />
                  <Text style={styles.retryInlineText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* 3. Subtitle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Subtitle</Text>
            <TextInput
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder="Brief summary or sub-headline (optional)"
              placeholderTextColor={COLORS.textPlaceholder}
              editable={!submitting}
              style={styles.input}
            />
          </View>

          {/* 4. Article Content * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Article Content *</Text>
            <TextInput
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (formError) setFormError('');
              }}
              placeholder="Write the full article report here..."
              placeholderTextColor={COLORS.textPlaceholder}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!submitting}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* 5. Tags (Comma separated) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tags (Comma separated)</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. National Highways, Amaravati, Expressways"
              placeholderTextColor={COLORS.textPlaceholder}
              editable={!submitting}
              style={styles.input}
            />
          </View>

          {/* 6. YouTube Video Link (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>YouTube Video Link (Optional)</Text>
            <TextInput
              value={youtubeLink}
              onChangeText={setYoutubeLink}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={COLORS.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!submitting}
              style={styles.input}
            />
          </View>

          {/* 7. Main Thumbnail * */}
          <ImageUploadField
            label="Main Thumbnail *"
            value={thumbnail}
            onChange={(url) => {
              setThumbnail(url);
              if (formError) setFormError('');
            }}
            disabled={submitting}
            onUploadingChange={setUploadingThumbnail}
          />

          {/* 8. Project Gallery Images (Optional) */}
          <GalleryImagePicker
            label="Project Gallery Images (Optional)"
            value={gallery}
            onChange={setGallery}
            disabled={submitting}
            onUploadingChange={setUploadingGallery}
          />
        </View>

        <View style={styles.footerActions}>
          <Pressable
            onPress={onCancel}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [
              styles.cancelButton,
              submitting && styles.buttonDisabled,
              pressed && !submitting && styles.cancelButtonPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            style={({ pressed }) => [
              styles.submitButton,
              isBusy && styles.buttonDisabled,
              pressed && !isBusy && styles.submitButtonPressed,
            ]}
          >
            {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default PostForm;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  backLinkPressed: {
    opacity: 0.7,
  },
  backLinkText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMuted,
  },
  headerBlock: {
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
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 160,
    paddingTop: SPACING.md,
  },
  categoryErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 2,
  },
  categoryErrorText: {
    flex: 1,
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.brandRedDark,
  },
  retryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.red50,
  },
  retryInlineText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  footerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  cancelButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  submitButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
