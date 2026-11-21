import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { Hero } from '@/components/home/Hero';
import { Posts } from '@/components/layout/Posts';
import { Footer } from '@/components/layout/Footer';

export default function HomeScreen() {
  const scrollRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshSignal((prev) => prev + 1);
  }, []);

  const handleRefreshDone = useCallback(() => {
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        RefreshControl ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.brandRed]}
          />
        ) : undefined
      }>
      <View style={styles.heroWrapper}>
        <Hero />
      </View>

      <Posts scrollRef={scrollRef} refreshSignal={refreshSignal} onRefreshDone={handleRefreshDone} />

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
});
