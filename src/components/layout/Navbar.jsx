import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';
import { TickerMarquee, parseTickerText } from '@/components/shared/TickerMarquee';

export const A6_LOGO_URL =
  'https://res.cloudinary.com/dkdidynja/image/upload/v1784568115/a6newsinfra_irdltr.png';

function PulsingIndicator() {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.75);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(2.1, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
    };
  }, [pulseOpacity, pulseScale]);

  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.pulseWrapper}>
      <Animated.View style={[styles.pulseRing, pingStyle]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

export function Navbar() {
  const router = useRouter();
  const [tickerItems, setTickerItems] = useState([]);
  const [loadingTicker, setLoadingTicker] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchTicker = async () => {
      try {
        const response = await api.get('/api/ticker');
        const text = response?.data?.data?.text || '';
        if (active) {
          setTickerItems(parseTickerText(text));
        }
      } catch {
        if (active) {
          setTickerItems([]);
        }
      } finally {
        if (active) {
          setLoadingTicker(false);
        }
      }
    };

    fetchTicker();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="button"
        accessibilityLabel="A6News Logo"
        style={({ pressed }) => [styles.logoBox, pressed && styles.logoPressed]}>
        {!logoError ? (
          <Image
            source={{ uri: A6_LOGO_URL }}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="A6News Logo"
            onError={() => setLogoError(true)}
          />
        ) : (
          <View style={styles.fallbackBrand}>
            <Text style={styles.fallbackBrandTitle}>A6NEWS</Text>
            <View style={styles.fallbackBrandBadge}>
              <Text style={styles.fallbackBrandBadgeText}>INFRA</Text>
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.tickerBox}>
        <PulsingIndicator />
        <TickerMarquee items={tickerItems} loading={loadingTicker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.navbarMobileHeight,
    backgroundColor: COLORS.white,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    height: 36,
    paddingRight: 10,
    borderRightWidth: LAYOUT.borderWidth,
    borderRightColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPressed: {
    opacity: 0.8,
  },
  logoImage: {
    width: 104,
    height: 32,
  },
  fallbackBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  fallbackBrandTitle: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  fallbackBrandBadge: {
    backgroundColor: COLORS.brandRed,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  fallbackBrandBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.white,
  },
  tickerBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tickerBackground,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  pulseWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandRed,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandRed,
  },
});

export default Navbar;
