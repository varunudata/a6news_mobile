import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowRight,
  Calendar,
  Check,
  Newspaper,
  PlayCircle,
  RefreshCw,
  Share2,
  Tag,
  X,
} from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api, { BACKEND_URL } from '@/services/api';
import { formatLongDate } from '@/utils/formatDate';
import { distributeArticleContent } from '@/utils/articleContent';
import { getYoutubeVideoId } from '@/utils/youtube';
import { ArticleCard } from '@/components/layout/ArticleCard';
import { Footer } from '@/components/layout/Footer';
import { Loader } from '@/components/shared/Loader';
import { YoutubeEmbed } from '@/components/shared/YoutubeEmbed';

export default function SinglePostScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;

  const scrollRef = useRef(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const copyTimerRef = useRef(null);

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const fetchPostData = useCallback(async (targetSlug) => {
    if (!targetSlug) {
      setLoading(false);
      setNotFound(true);
      setPost(null);
      setRelatedPosts([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setPost(null);
    setRelatedPosts([]);
    setLightboxImg(null);
    setCopied(false);

    try {
      const response = await api.get(`/api/posts/${encodeURIComponent(targetSlug)}`);
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;

      const fetchedPost = response?.data?.data;
      if (!fetchedPost) {
        setNotFound(true);
        return;
      }

      setPost(fetchedPost);

      const catId = fetchedPost.categoryId ?? fetchedPost.category?.id;
      if (catId) {
        try {
          const catResponse = await api.get(`/api/categories/${catId}`);
          if (!isMountedRef.current || requestId !== requestIdRef.current) return;

          const catPosts = Array.isArray(catResponse?.data?.data?.posts)
            ? catResponse.data.data.posts
            : [];

          const filtered = catPosts
            .filter(
              (p) =>
                p &&
                p.slug !== fetchedPost.slug &&
                p.slug !== targetSlug &&
                String(p.id) !== String(fetchedPost.id)
            )
            .sort(
              (a, b) =>
                new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            )
            .slice(0, 3);

          setRelatedPosts(filtered);
        } catch {
          if (isMountedRef.current && requestId === requestIdRef.current) {
            setRelatedPosts([]);
          }
        }
      }
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      const status = err?.response?.status;
      if (status === 404 || status === 400) {
        setNotFound(true);
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'కథనం లోడ్ చేయడంలో లోపం ఏర్పడింది.'
        );
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    fetchPostData(rawSlug);
  }, [rawSlug, fetchPostData]);

  const handleCopyLink = async () => {
    if (!rawSlug) return;
    try {
      const base = String(BACKEND_URL || '').replace(/\/api$/, '').replace(/\/+$/, '');
      const shareUrl = `${base}/posts/${rawSlug}`;
      await Clipboard.setStringAsync(shareUrl);
      if (!isMountedRef.current) return;

      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setCopied(false);
        }
      }, 2000);
    } catch {
      // Ignore clipboard failures gracefully
    }
  };

  const { paragraphs, galleryImages, imagesAfterParagraph } = useMemo(
    () => distributeArticleContent(post?.content, post?.gallery),
    [post?.content, post?.gallery]
  );

  const videoId = useMemo(() => getYoutubeVideoId(post?.youtubeLink), [post?.youtubeLink]);

  const validTags = useMemo(() => {
    if (!Array.isArray(post?.tags)) return [];
    return post.tags.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);
  }, [post?.tags]);

  const categoryId = post?.category?.id ?? post?.categoryId;
  const categoryName = post?.category?.name || 'విభాగం';
  const formattedDate = formatLongDate(post?.createdAt);
  const subtitleText = post?.subtitle ? String(post.subtitle).trim() : '';
  const thumbnailUrl = post?.thumbnail ? String(post.thumbnail).trim() : '';

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.main}>
          {loading ? (
            <View style={styles.loaderWrap}>
              <Loader label="కథనం లోడ్ అవుతోంది..." size="lg" />
            </View>
          ) : notFound ? (
            <View style={styles.stateCard}>
              <Newspaper size={36} color={COLORS.gray400} />
              <Text style={styles.stateHeading}>ఈ కథనం అందుబాటులో లేదు</Text>
              <Text style={styles.stateDescription}>
                మీరు వెతుకుతున్న వార్త తొలగించబడి ఉండవచ్చు లేదా మార్చబడి ఉండవచ్చు.
              </Text>
              <Pressable
                onPress={() => router.push('/')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                <Text style={styles.primaryButtonText}>హోమ్ పేజీకి వెళ్ళండి</Text>
              </Pressable>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Newspaper size={36} color={COLORS.gray400} />
              <Text style={styles.stateHeading}>కథనం లోడ్ కాలేదు</Text>
              <Text style={styles.stateDescription}>{error}</Text>
              <View style={styles.stateActions}>
                <Pressable
                  onPress={() => fetchPostData(rawSlug)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                  ]}>
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
          ) : post ? (
            <>
              {/* 1. Breadcrumb */}
              <View style={styles.breadcrumbRow}>
                <Pressable
                  onPress={() => router.push('/')}
                  accessibilityRole="link"
                  style={({ pressed }) => pressed && styles.pressedOpacity}>
                  <Text style={styles.breadcrumbLink}>హోమ్</Text>
                </Pressable>
                <Text style={styles.breadcrumbSep}>/</Text>
                <Pressable
                  disabled={!categoryId}
                  onPress={() => categoryId && router.push(`/category/${categoryId}`)}
                  accessibilityRole="link"
                  style={({ pressed }) => pressed && categoryId && styles.pressedOpacity}>
                  <Text style={styles.breadcrumbLink}>{categoryName}</Text>
                </Pressable>
                <Text style={styles.breadcrumbSep}>/</Text>
                <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
                  {post.title}
                </Text>
              </View>

              {/* 2. Meta Bar */}
              <View style={styles.metaBar}>
                <View style={styles.metaLeft}>
                  {categoryId ? (
                    <Pressable
                      onPress={() => router.push(`/category/${categoryId}`)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.categoryPill,
                        pressed && styles.primaryButtonPressed,
                      ]}>
                      <Text style={styles.categoryPillText}>{categoryName}</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{categoryName}</Text>
                    </View>
                  )}

                  {formattedDate ? (
                    <View style={styles.dateRow}>
                      <Calendar size={14} color={COLORS.gray400} />
                      <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  onPress={handleCopyLink}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? 'లింక్ కాపీ అయింది' : 'షేర్ చేయండి'}
                  style={({ pressed }) => [
                    styles.shareButton,
                    copied && styles.shareButtonCopied,
                    pressed && !copied && styles.secondaryButtonPressed,
                  ]}>
                  {copied ? (
                    <>
                      <Check size={14} color={COLORS.green600} />
                      <Text style={styles.shareTextCopied}>లింక్ కాపీ అయింది</Text>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} color={COLORS.textSecondary} />
                      <Text style={styles.shareText}>షేర్ చేయండి</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* 3. Article Title */}
              <Text style={styles.articleTitle}>{post.title}</Text>

              {/* 4. Subtitle Callout */}
              {subtitleText ? (
                <View style={styles.subtitleBox}>
                  <Text style={styles.subtitleText}>{subtitleText}</Text>
                </View>
              ) : null}

              {/* 5. Main Thumbnail */}
              {thumbnailUrl ? (
                <View style={styles.thumbnailCard}>
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnailImage}
                    resizeMode="contain"
                    accessibilityLabel={post.title}
                  />
                </View>
              ) : null}

              {/* 6. Interleaved Article Content & Inline Gallery Images */}
              <View style={styles.articleBody}>
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, paraIdx) => {
                    const inlineImgs = imagesAfterParagraph[paraIdx] || [];
                    return (
                      <View key={`para-block-${paraIdx}`} style={styles.paragraphBlock}>
                        <Text style={styles.paragraphText}>{para}</Text>

                        {inlineImgs.length > 0 ? (
                          <View style={styles.inlineGalleryGroup}>
                            {inlineImgs.map((imgObj) => (
                              <Pressable
                                key={`inline-img-${imgObj.index}`}
                                onPress={() => setLightboxImg(imgObj.url)}
                                accessibilityRole="button"
                                accessibilityLabel={`Gallery image ${imgObj.index + 1}`}
                                style={({ pressed }) => [
                                  styles.inlineImageCard,
                                  pressed && styles.pressedOpacity,
                                ]}>
                                <Image
                                  source={{ uri: imgObj.url }}
                                  style={styles.inlineImage}
                                  resizeMode="contain"
                                />
                              </Pressable>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                ) : galleryImages.length > 0 ? (
                  <View style={styles.inlineGalleryGroup}>
                    {galleryImages.map((imgUrl, idx) => (
                      <Pressable
                        key={`fallback-img-${idx}`}
                        onPress={() => setLightboxImg(imgUrl)}
                        accessibilityRole="button"
                        accessibilityLabel={`Gallery image ${idx + 1}`}
                        style={({ pressed }) => [
                          styles.inlineImageCard,
                          pressed && styles.pressedOpacity,
                        ]}>
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.inlineImage}
                          resizeMode="contain"
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* 7. YouTube Video Section */}
              {videoId ? (
                <View style={styles.youtubeSection}>
                  <View style={styles.youtubeHeader}>
                    <PlayCircle size={18} color={COLORS.brandRed} />
                    <Text style={styles.youtubeHeading}>వీడియో రిపోర్ట్</Text>
                  </View>
                  <YoutubeEmbed videoId={videoId} youtubeLink={post.youtubeLink} />
                </View>
              ) : null}

              {/* 8. Tags Section */}
              {validTags.length > 0 ? (
                <View style={styles.tagsSection}>
                  <View style={styles.tagsLabelRow}>
                    <Tag size={15} color={COLORS.textMeta} />
                    <Text style={styles.tagsLabel}>టాపిక్స్:</Text>
                  </View>
                  <View style={styles.tagsWrap}>
                    {validTags.map((tagItem, idx) => (
                      <View key={`${tagItem}-${idx}`} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tagItem}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* 9. Related Articles Section */}
              <View style={styles.relatedSection}>
                <View style={styles.relatedHeader}>
                  <View style={styles.relatedHeaderLeft}>
                    <Text style={styles.relatedEyebrow}>ఇదే విభాగం నుండి మరిన్ని</Text>
                    <Text style={styles.relatedHeading}>సంబంధిత వార్తలు</Text>
                  </View>

                  {categoryId ? (
                    <Pressable
                      onPress={() => router.push(`/category/${categoryId}`)}
                      accessibilityRole="link"
                      style={({ pressed }) => [styles.viewAllLink, pressed && styles.pressedOpacity]}>
                      <Text style={styles.viewAllText}>అన్నీ చూడండి</Text>
                      <ArrowRight size={14} color={COLORS.brandRed} />
                    </Pressable>
                  ) : null}
                </View>

                {relatedPosts.length === 0 ? (
                  <View style={styles.relatedEmptyCard}>
                    <Text style={styles.relatedEmptyText}>
                      ఈ విభాగంలో సంబంధిత వార్తలు అందుబాటులో లేవు.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.relatedList}>
                    {relatedPosts.map((relPost, idx) => (
                      <ArticleCard
                        key={relPost.id ?? relPost.slug ?? `related-${idx}`}
                        post={relPost}
                        categoryLabel={post.category?.name || relPost.category?.name}
                        noImageText="No Image"
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </View>

        {/* 10. Existing Footer */}
        <Footer />
      </ScrollView>

      {/* Image Lightbox Modal */}
      <Modal
        visible={Boolean(lightboxImg)}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxImg(null)}>
        <View style={styles.lightboxOverlay}>
          <View style={styles.lightboxHeader}>
            <Text style={styles.lightboxTitle}>Image Preview</Text>
            <Pressable
              onPress={() => setLightboxImg(null)}
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
              style={({ pressed }) => [styles.lightboxCloseBtn, pressed && styles.pressedOpacity]}>
              <X size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.lightboxBody}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setLightboxImg(null)} />
            {lightboxImg ? (
              <Image
                source={{ uri: lightboxImg }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
    marginTop: SPACING.lg,
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
  pressedOpacity: {
    opacity: 0.75,
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
  breadcrumbCurrent: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPlaceholder,
    flexShrink: 1,
  },
  metaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metaLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  categoryPill: {
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryPillText: {
    ...TYPOGRAPHY.scale.badge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 6,
  },
  shareButtonCopied: {
    borderColor: COLORS.green600,
    backgroundColor: COLORS.gray50,
  },
  shareText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  shareTextCopied: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.green700,
  },
  articleTitle: {
    ...TYPOGRAPHY.scale.xxl,
    lineHeight: 32,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.gray900,
    marginBottom: SPACING.lg,
  },
  subtitleBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.brandRed,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xl,
  },
  subtitleText: {
    ...TYPOGRAPHY.scale.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  thumbnailCard: {
    backgroundColor: COLORS.thumbnailBackdrop,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  thumbnailImage: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.thumbnailBackdrop,
  },
  articleBody: {
    gap: SPACING.lg,
  },
  paragraphBlock: {
    gap: SPACING.lg,
  },
  paragraphText: {
    ...TYPOGRAPHY.scale.articleBodyMobile,
    color: COLORS.textBody,
  },
  inlineGalleryGroup: {
    gap: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  inlineImageCard: {
    backgroundColor: COLORS.inlinePhotoBackdrop,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    padding: SPACING.xs,
  },
  inlineImage: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.inlinePhotoBackdrop,
  },
  youtubeSection: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  youtubeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
    backgroundColor: COLORS.backgroundSecondary,
  },
  youtubeHeading: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  tagsSection: {
    marginTop: SPACING.xxl,
    paddingTop: SPACING.lg,
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.borderCard,
    gap: SPACING.sm,
  },
  tagsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagsLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMeta,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagPill: {
    backgroundColor: COLORS.tagBackground,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  relatedSection: {
    marginTop: SPACING.xxxl,
    paddingTop: SPACING.xxl,
    borderTopWidth: LAYOUT.dividerWidth,
    borderTopColor: COLORS.gray900,
    gap: SPACING.xl,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  relatedHeaderLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  relatedEyebrow: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
  relatedHeading: {
    ...TYPOGRAPHY.scale.xl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  viewAllText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
  relatedEmptyCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  relatedEmptyText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMeta,
    textAlign: 'center',
  },
  relatedList: {
    gap: SPACING.xxl,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: COLORS.lightboxBackdrop,
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
  },
  lightboxTitle: {
    ...TYPOGRAPHY.scale.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  lightboxCloseBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray100,
  },
  lightboxBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  lightboxImage: {
    width: '100%',
    height: '75%',
  },
});
