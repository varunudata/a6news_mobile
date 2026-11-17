import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { Hero } from '@/components/home/Hero';
import { Posts } from '@/components/layout/Posts';
import { Footer } from '@/components/layout/Footer';

export default function HomeScreen() {
  const scrollRef = useRef(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrapper}>
        <Hero />
      </View>

      <Posts scrollRef={scrollRef} />

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
