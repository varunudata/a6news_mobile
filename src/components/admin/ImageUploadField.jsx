import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';

const ACCENT_BLUE = '#1D4ED8';
const ACCENT_BLUE_BG = '#EFF6FF';
const ACCENT_BLUE_BORDER = '#BFDBFE';

/**
 * Reusable single-image upload field with 16:9 uncropped preview and Cloudinary integration.
 */
export function ImageUploadField({
  label = 'Main Thumbnail *',
  value = '',
  onChange,
  disabled = false,
  onUploadingChange,
  onError,
}) {
  const [uploading, setUploading] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const handlePickImage = async () => {
    if (disabled || uploading) {
      return;
    }

    setFieldError('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result?.canceled || !Array.isArray(result?.assets) || result.assets.length === 0) {
        return;
      }

      setUploading(true);
      onUploadingChange?.(true);

      const uploadedUrl = await uploadToCloudinary(result.assets[0]);
      onChange?.(uploadedUrl);
    } catch (err) {
      const message = err?.message || 'Failed to upload thumbnail. Please try again.';
      setFieldError(message);
      onError?.(message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleRemove = () => {
    if (disabled || uploading) {
      return;
    }
    setFieldError('');
    onChange?.('');
  };

  const isBusy = disabled || uploading;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {value ? (
        <View style={styles.previewWrapper}>
          <View style={styles.imageBox}>
            <Image source={{ uri: value }} style={styles.previewImage} resizeMode="contain" />
            <Pressable
              onPress={handleRemove}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Remove thumbnail"
              style={({ pressed }) => [
                styles.removeButton,
                isBusy && styles.disabledControl,
                pressed && !isBusy && styles.removeButtonPressed,
              ]}
            >
              <X size={16} color={COLORS.white} />
            </Pressable>
          </View>

          <Pressable
            onPress={handlePickImage}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={uploading ? 'Uploading thumbnail' : 'Replace Thumbnail'}
            style={({ pressed }) => [
              styles.replaceButton,
              isBusy && styles.disabledControl,
              pressed && !isBusy && styles.replaceButtonPressed,
            ]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={ACCENT_BLUE} />
            ) : (
              <Upload size={15} color={ACCENT_BLUE} />
            )}
            <Text style={styles.replaceButtonText}>
              {uploading ? 'Uploading...' : 'Replace Thumbnail'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handlePickImage}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel={uploading ? 'Uploading thumbnail' : 'Upload Thumbnail'}
          style={({ pressed }) => [
            styles.uploadBox,
            isBusy && styles.disabledControl,
            pressed && !isBusy && styles.uploadBoxPressed,
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={ACCENT_BLUE} />
          ) : (
            <View style={styles.uploadIconCircle}>
              <Upload size={20} color={ACCENT_BLUE} />
            </View>
          )}
          <Text style={styles.uploadTitle}>
            {uploading ? 'Uploading...' : 'Upload Thumbnail'}
          </Text>
          <Text style={styles.uploadHint}>PNG, JPG or WEBP image (uncropped 16:9 preview)</Text>
        </Pressable>
      )}

      {fieldError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {fieldError}
        </Text>
      ) : null}
    </View>
  );
}

export default ImageUploadField;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  previewWrapper: {
    gap: SPACING.sm,
  },
  imageBox: {
    width: '100%',
    aspectRatio: LAYOUT.cardThumbnailAspectRatio,
    backgroundColor: COLORS.thumbnailBackdrop,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.imageRemoveBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    opacity: 0.8,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: ACCENT_BLUE_BG,
    borderWidth: LAYOUT.borderWidth,
    borderColor: ACCENT_BLUE_BORDER,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  replaceButtonPressed: {
    opacity: 0.85,
  },
  replaceButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: ACCENT_BLUE,
  },
  uploadBox: {
    borderWidth: LAYOUT.borderWidth,
    borderStyle: 'dashed',
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  uploadBoxPressed: {
    backgroundColor: ACCENT_BLUE_BG,
    borderColor: ACCENT_BLUE_BORDER,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: ACCENT_BLUE_BG,
    borderWidth: LAYOUT.borderWidth,
    borderColor: ACCENT_BLUE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  uploadTitle: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  uploadHint: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
    textAlign: 'center',
  },
  disabledControl: {
    opacity: 0.6,
  },
  errorText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
});
