import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export const MARQUEE_DURATION_MS = 28000;
export const TICKER_LOADING_TEXT = 'తాజా వార్తలు లోడ్ అవుతున్నాయి...';
export const TICKER_EMPTY_FALLBACK_TEXT =
  'జాతీయ రహదారులు, ఎక్స్‌ప్రెస్‌వేలు, రైల్వేలు, విమానాశ్రయాలు మరియు మౌలిక సదుపాయాల తాజా వార్తలు';

export function parseTickerText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/[•\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function TickerSegment({ items, onLayout }) {
  return (
    <View style={styles.segment} onLayout={onLayout}>
      {items.map((item, idx) => (
        <View key={`${idx}-${item.slice(0, 12)}`} style={styles.itemWrapper}>
          <Text style={styles.itemText} numberOfLines={1}>
            {item}
          </Text>
          <Text style={styles.bullet}>•</Text>
        </View>
      ))}
    </View>
  );
}

export function TickerMarquee({ items = [], text = '', loading = false, emptyText, style }) {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const parsedItems = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item) => String(item).trim()).filter(Boolean);
    }
    return parseTickerText(text);
  }, [items, text]);

  const displayItems = useMemo(() => {
    if (parsedItems.length > 0) return parsedItems;
    if (loading) return [];
    return [emptyText || TICKER_EMPTY_FALLBACK_TEXT];
  }, [parsedItems, loading, emptyText]);

  const itemsKey = displayItems.join('|');

  useEffect(() => {
    cancelAnimation(translateX);
    translateX.value = 0;

    if (segmentWidth > 0 && displayItems.length > 0) {
      translateX.value = withRepeat(
        withTiming(-segmentWidth, {
          duration: MARQUEE_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [segmentWidth, itemsKey, displayItems.length, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (loading && parsedItems.length === 0) {
    return (
      <View style={[styles.viewport, style]}>
        <Text style={styles.loadingText} numberOfLines={1} ellipsizeMode="tail">
          {TICKER_LOADING_TEXT}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.viewport, style]}>
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.track, animatedStyle]}>
          <TickerSegment
            items={displayItems}
            onLayout={(event) => {
              const measuredWidth = event.nativeEvent.layout.width;
              if (measuredWidth > 0 && Math.abs(measuredWidth - segmentWidth) > 1) {
                setSegmentWidth(measuredWidth);
              }
            }}
          />
          <TickerSegment items={displayItems} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 20,
  },
  scrollContainer: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textBody,
  },
  bullet: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.red400,
    marginHorizontal: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
});

export default TickerMarquee;
