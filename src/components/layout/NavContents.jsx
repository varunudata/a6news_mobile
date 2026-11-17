import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { FALLBACK_CATEGORIES } from '@/constants/fallbackCategories';
import api from '@/services/api';

const SKELETON_COUNT = 7;

export function NavContents() {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef(null);
  const itemLayoutsRef = useRef({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        const list = response?.data?.data;
        if (active) {
          if (Array.isArray(list) && list.length > 0) {
            setCategories(list);
          } else {
            setCategories(FALLBACK_CATEGORIES);
          }
        }
      } catch {
        if (active) {
          setCategories(FALLBACK_CATEGORIES);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pathname || categories.length === 0 || viewportWidth <= 0) return;

    const activeCategory = categories.find((cat) => pathname === `/category/${cat.id}`);
    if (!activeCategory) return;

    const timer = setTimeout(() => {
      const layout = itemLayoutsRef.current[activeCategory.id];
      if (layout && scrollRef.current) {
        const targetX = Math.max(0, layout.x - viewportWidth / 2 + layout.width / 2);
        scrollRef.current.scrollTo({ x: targetX, animated: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, categories, viewportWidth]);

  const isHomeActive = pathname === '/';

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="button"
        accessibilityLabel="Home"
        style={({ pressed }) => [
          styles.homeButton,
          isHomeActive && styles.activeTabBorder,
          pressed && styles.pressedItem,
        ]}>
        <Text style={[styles.navText, styles.activeNavText]}>HOME</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={styles.scrollContent}>
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <View key={`cat-skel-${index}`} style={styles.skeletonBar} />
            ))
          : categories.map((cat) => {
              const targetPath = `/category/${cat.id}`;
              const isActive = pathname === targetPath;

              return (
                <Pressable
                  key={cat.id}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    itemLayoutsRef.current[cat.id] = { x, width };
                  }}
                  onPress={() => router.push(targetPath)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.categoryTab,
                    isActive && styles.activeTabBorder,
                    pressed && styles.pressedItem,
                  ]}>
                  <Text
                    style={[styles.navText, isActive ? styles.activeNavText : styles.inactiveNavText]}
                    numberOfLines={1}>
                    {String(cat.name || '').toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.navContentsHeight,
    backgroundColor: COLORS.brandRed,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.brandRedDark,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeButton: {
    height: '100%',
    justifyContent: 'center',
    paddingRight: SPACING.lg,
    marginRight: SPACING.sm,
    borderRightWidth: LAYOUT.borderWidth,
    borderRightColor: COLORS.red400Alpha50,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    gap: SPACING.xl,
    paddingRight: SPACING.md,
    height: '100%',
  },
  categoryTab: {
    height: '100%',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabBorder: {
    borderBottomColor: COLORS.white,
  },
  pressedItem: {
    opacity: 0.75,
  },
  navText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.4,
  },
  activeNavText: {
    color: COLORS.white,
  },
  inactiveNavText: {
    color: COLORS.whiteAlpha85,
  },
  skeletonBar: {
    width: 84,
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.whiteAlpha25,
  },
});

export default NavContents;
