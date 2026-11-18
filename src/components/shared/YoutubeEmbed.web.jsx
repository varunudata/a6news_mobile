import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PlayCircle } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

/**
 * Web fallback for YoutubeEmbed so Web/SSR builds do not pull react-native-web-webview.
 */
export function YoutubeEmbed({ videoId, youtubeLink }) {
  if (!videoId) return null;
  const fallbackUrl = youtubeLink || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <View style={styles.container}>
      <PlayCircle size={32} color={COLORS.white} />
      <Text style={styles.label}>YouTube Video ({videoId})</Text>
      <Pressable
        onPress={() => Linking.openURL(fallbackUrl).catch(() => {})}
        accessibilityRole="link"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>YouTube లో చూడండి</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: LAYOUT.heroAspectRatio,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  button: {
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default YoutubeEmbed;
