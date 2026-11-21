import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, Newspaper, PlayCircle } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { formatShortDate } from '@/utils/formatDate';

function getExcerpt(post) {
  if (post?.subtitle && String(post.subtitle).trim()) {
    return String(post.subtitle).trim();
  }
  const content = post?.content ? String(post.content).trim() : '';
  if (!content) return '';
  return content.length > 130 ? `${content.slice(0, 130)}...` : content;
}

function resolveCategoryLabel(post, categoryLabel) {
  if (categoryLabel) return String(categoryLabel);
  if (typeof post?.category === 'string' && post.category.trim()) return post.category.trim();
  if (post?.category?.name) return String(post.category.name);
  return 'News';
}

export function ArticleCard({
  post,
  categoryLabel,
  noImageText = 'No Image Available',
  onPress,
  style,
}) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [post?.thumbnail]);

  const handlePress = () => {
    if (onPress) {
      onPress(post);
      return;
    }
    if (post?.slug) {
      router.push(`/posts/${post.slug}`);
    }
  };

  const badgeLabel = resolveCategoryLabel(post, categoryLabel);
  const formattedDate = formatShortDate(post?.createdAt);
  const excerpt = getExcerpt(post);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={post?.title || 'Article'}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {badgeLabel}
          </Text>
        </View>

        {formattedDate ? (
          <View style={styles.dateRow}>
            <Calendar size={14} color={COLORS.gray400} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        ) : null}
      </View>

      {/* Uncropped 16:9 Thumbnail Container */}
      <View style={styles.thumbnailWrapper}>
        {post?.thumbnail && !imageError ? (
          <Image
            source={{ uri: post.thumbnail }}
            style={styles.thumbnailImage}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Newspaper size={28} color={COLORS.gray400} />
            <Text style={styles.noImageText}>{noImageText}</Text>
          </View>
        )}

        {post?.youtubeLink ? (
          <View style={styles.videoBadge}>
            <PlayCircle size={12} color={COLORS.white} />
            <Text style={styles.videoBadgeText}>Video</Text>
          </View>
        ) : null}
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {post?.title || ''}
        </Text>

        {excerpt ? (
          <Text style={styles.excerpt} numberOfLines={3}>
            {excerpt}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.ctaText}>పూర్తి కథనం చదవండి</Text>
          <ArrowRight size={16} color={COLORS.brandRed} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    maxWidth: '65%',
  },
  categoryBadgeText: {
    ...TYPOGRAPHY.scale.badge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  thumbnailWrapper: {
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
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  noImageText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textPlaceholder,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  videoBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  videoBadgeText: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  body: {
    padding: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.scale.baseSnug,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  excerpt: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  footerRow: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
});

export default ArticleCard;
