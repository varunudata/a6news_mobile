import { useState } from 'react';
import { Dimensions, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { PlayCircle } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const DEFAULT_WIDTH = Math.max(260, Dimensions.get('window').width - SPACING.lg * 2 - 2);

export function YoutubeEmbed({ videoId, youtubeLink }) {
  const [containerWidth, setContainerWidth] = useState(DEFAULT_WIDTH);
  const [hasError, setHasError] = useState(false);

  if (!videoId) return null;

  const playerHeight = Math.round(containerWidth * (9 / 16));
  const fallbackUrl = youtubeLink || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <View
      style={styles.playerBox}
      onLayout={(event) => {
        const measured = event.nativeEvent.layout.width;
        if (measured > 0 && Math.abs(measured - containerWidth) > 1) {
          setContainerWidth(measured);
        }
      }}>
      {hasError ? (
        <View style={[styles.fallbackContainer, { height: playerHeight }]}>
          <PlayCircle size={32} color={COLORS.white} />
          <Text style={styles.fallbackText}>వీడియో ప్లేయర్ లోడ్ కాలేదు</Text>
          <Pressable
            onPress={() => Linking.openURL(fallbackUrl).catch(() => {})}
            accessibilityRole="link"
            style={({ pressed }) => [styles.fallbackButton, pressed && styles.pressed]}>
            <Text style={styles.fallbackButtonText}>YouTube లో చూడండి</Text>
          </Pressable>
        </View>
      ) : (
        <YoutubePlayer
          height={playerHeight}
          width={containerWidth}
          videoId={videoId}
          play={false}
          onError={() => setHasError(true)}
          webViewProps={{
            androidLayerType: 'hardware',
            allowsFullscreenVideo: true,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playerBox: {
    width: '100%',
    backgroundColor: COLORS.black,
    overflow: 'hidden',
  },
  fallbackContainer: {
    width: '100%',
    backgroundColor: COLORS.heroViewportDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  fallbackText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  fallbackButton: {
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  fallbackButtonText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default YoutubeEmbed;
