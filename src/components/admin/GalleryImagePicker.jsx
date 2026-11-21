import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';

/**
 * Multi-image Cloudinary uploader and 2-column 16:10 gallery preview grid.
 */
export function GalleryImagePicker({
  label = 'Project Gallery Images (Optional)',
  value = [],
  onChange,
  disabled = false,
  onUploadingChange,
  onError,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [fieldError, setFieldError] = useState('');

  const galleryList = Array.isArray(value) ? value : [];

  const handlePickGalleryImages = async () => {
    if (disabled || uploading) {
      return;
    }

    setFieldError('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result?.canceled || !Array.isArray(result?.assets) || result.assets.length === 0) {
        return;
      }

      const assets = result.assets;
      setUploading(true);
      setProgress({ completed: 0, total: assets.length });
      onUploadingChange?.(true);

      const uploadedUrls = [];
      let failedCount = 0;
      let firstErrorMessage = '';

      for (let idx = 0; idx < assets.length; idx += 1) {
        try {
          const secureUrl = await uploadToCloudinary(assets[idx]);
          uploadedUrls.push(secureUrl);
        } catch (err) {
          failedCount += 1;
          if (!firstErrorMessage) {
            firstErrorMessage = err?.message || 'Upload failed';
          }
        } finally {
          setProgress({ completed: idx + 1, total: assets.length });
        }
      }

      if (uploadedUrls.length > 0) {
        onChange?.([...galleryList, ...uploadedUrls]);
      }

      if (failedCount > 0) {
        const message =
          uploadedUrls.length > 0
            ? `${uploadedUrls.length} uploaded, ${failedCount} failed (${firstErrorMessage}).`
            : `Failed to upload gallery image(s): ${firstErrorMessage}`;
        setFieldError(message);
        onError?.(message);
      }
    } catch (err) {
      const message = err?.message || 'Failed to select gallery images.';
      setFieldError(message);
      onError?.(message);
    } finally {
      setUploading(false);
      setProgress({ completed: 0, total: 0 });
      onUploadingChange?.(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    if (disabled || uploading) {
      return;
    }
    onChange?.(galleryList.filter((_, idx) => idx !== indexToRemove));
  };

  const isBusy = disabled || uploading;
  const uploadButtonLabel = uploading
    ? progress.total > 0
      ? `Uploading Images (${progress.completed}/${progress.total})...`
      : 'Uploading Images...'
    : galleryList.length > 0
      ? 'Add Gallery Images'
      : 'Upload Gallery Images';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {galleryList.length > 0 ? (
          <Text style={styles.countText}>{galleryList.length} selected</Text>
        ) : null}
      </View>

      <Pressable
        onPress={handlePickGalleryImages}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={
          galleryList.length > 0 ? 'Add Gallery Images' : 'Upload Gallery Images'
        }
        style={({ pressed }) => [
          styles.uploadButton,
          isBusy && styles.disabledControl,
          pressed && !isBusy && styles.uploadButtonPressed,
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={COLORS.accentBlue} />
        ) : (
          <Upload size={15} color={COLORS.accentBlue} />
        )}
        <Text style={styles.uploadButtonText}>{uploadButtonLabel}</Text>
      </Pressable>

      {galleryList.length > 0 ? (
        <View style={styles.grid}>
          {galleryList.map((url, idx) => (
            <View key={`${url}-${idx}`} style={styles.gridItem}>
              <Image source={{ uri: url }} style={styles.gridImage} resizeMode="contain" />
              <Pressable
                onPress={() => handleRemoveImage(idx)}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Remove gallery image ${idx + 1}`}
                style={({ pressed }) => [
                  styles.removeButton,
                  isBusy && styles.disabledControl,
                  pressed && !isBusy && styles.removeButtonPressed,
                ]}
              >
                <X size={14} color={COLORS.white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {fieldError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {fieldError}
        </Text>
      ) : null}
    </View>
  );
}

export default GalleryImagePicker;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    flex: 1,
  },
  countText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    gap: SPACING.sm,
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  uploadButtonPressed: {
    opacity: 0.85,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.sm,
  },
  gridItem: {
    width: '48.5%',
    aspectRatio: LAYOUT.galleryPreviewAspectRatio,
    backgroundColor: COLORS.thumbnailBackdrop,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.imageRemoveBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    opacity: 0.8,
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
