import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { HERO_SLIDES } from '@/constants/heroSlides';

export { HERO_SLIDES };
export const HERO_AUTOPLAY_MS = 4500;

export function Hero() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSlides, setFailedSlides] = useState({});

  const totalSlides = HERO_SLIDES.length;
  const current = HERO_SLIDES[index] || HERO_SLIDES[0];

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return undefined;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % totalSlides);
    }, HERO_AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  const formattedSlideNum = `0${index + 1}`;
  const formattedTotal = `0${totalSlides}`;

  return (
    <View
      style={styles.container}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onTouchCancel={() => setIsPaused(false)}>
      {/* 16:9 Image Viewport */}
      <View style={styles.imageViewport}>
        {failedSlides[index] ? (
          <View style={styles.slideFallback}>
            <Newspaper size={36} color={COLORS.gray400} />
          </View>
        ) : (
          <Image
            source={{ uri: current.image }}
            style={styles.slideImage}
            resizeMode="cover"
            accessibilityLabel={current.title}
            onError={() => setFailedSlides((prev) => ({ ...prev, [index]: true }))}
          />
        )}

        {/* Top-Left Slide Counter */}
        <View style={styles.counterPill}>
          <Text style={styles.counterActive}>{formattedSlideNum}</Text>
          <Text style={styles.counterTotal}> / {formattedTotal}</Text>
        </View>

        {/* Circular Prev / Next Controls */}
        <Pressable
          onPress={goPrev}
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          accessibilityRole="button"
          accessibilityLabel="Previous slide"
          style={({ pressed }) => [styles.arrowBtn, styles.arrowLeft, pressed && styles.arrowPressed]}>
          <ChevronLeft size={18} color={COLORS.textPrimary} />
        </Pressable>

        <Pressable
          onPress={goNext}
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          accessibilityRole="button"
          accessibilityLabel="Next slide"
          style={({ pressed }) => [styles.arrowBtn, styles.arrowRight, pressed && styles.arrowPressed]}>
          <ChevronRight size={18} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Solid White Caption & Controls Section */}
      <View style={styles.captionBar}>
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{current.category}</Text>
          </View>
          <Text style={styles.eyebrowText} numberOfLines={1}>
            ప్రత్యేక మౌలిక సదుపాయాల విభాగం
          </Text>
        </View>

        <Text style={styles.title}>{current.title}</Text>

        <Text style={styles.subtitle} numberOfLines={2}>
          {current.subtitle}
        </Text>

        <View style={styles.controlsRow}>
          {/* 6 Slide Indicator Dots */}
          <View style={styles.dotsRow}>
            {HERO_SLIDES.map((slide, dotIndex) => {
              const isActive = dotIndex === index;
              return (
                <Pressable
                  key={`${slide.categoryId}-${dotIndex}`}
                  onPress={() => setIndex(dotIndex)}
                  onPressIn={() => setIsPaused(true)}
                  onPressOut={() => setIsPaused(false)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Slide ${dotIndex + 1}`}
                  accessibilityState={{ selected: isActive }}
                  style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]}
                />
              );
            })}
          </View>

          {/* Category CTA Button */}
          <Pressable
            onPress={() => router.push(`/category/${current.categoryId}`)}
            accessibilityRole="button"
            accessibilityLabel={`${current.category} మరిన్ని వార్తలు`}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
            <Text style={styles.ctaButtonText}>మరిన్ని వార్తలు</Text>
            <ArrowRight size={16} color={COLORS.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
  },
  imageViewport: {
    width: '100%',
    aspectRatio: LAYOUT.heroAspectRatio,
    backgroundColor: COLORS.heroViewportDark,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterPill: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterActive: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
  },
  counterTotal: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: SPACING.md,
  },
  arrowRight: {
    right: SPACING.md,
  },
  arrowPressed: {
    backgroundColor: COLORS.gray100,
  },
  captionBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryPill: {
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryPillText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  eyebrowText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
    flexShrink: 1,
  },
  title: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.xs,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  controlsRow: {
    marginTop: SPACING.xxs,
    paddingTop: 10,
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.brandRed,
  },
  dotInactive: {
    width: 10,
    backgroundColor: COLORS.gray300,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  ctaButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  ctaButtonText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});

export default Hero;
