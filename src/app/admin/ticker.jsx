import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react-native';

import { Loader } from '@/components/shared/Loader';
import { TickerMarquee, parseTickerText } from '@/components/shared/TickerMarquee';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

function showAndroidToast(message) {
  if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

/**
 * Admin News Ticker Management screen (/admin/ticker).
 * Provides live TickerMarquee preview, individual headline add/edit/reorder/remove,
 * multiline raw text editing, Reset, and PUT /api/ticker persistence.
 */
export default function AdminTickerScreen() {
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [headlineItems, setHeadlineItems] = useState([]);
  const [newHeadline, setNewHeadline] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTicker = useCallback(async ({ isRefresh = false } = {}) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await api.get('/api/ticker');
      if (!isMountedRef.current) {
        return;
      }

      const fetchedText = String(response?.data?.data?.text || '');
      setText(fetchedText);
      setOriginalText(fetchedText);
      setHeadlineItems(parseTickerText(fetchedText));
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load breaking news ticker.'
      );
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTicker();
  }, [fetchTicker]);

  const previewItems = useMemo(() => parseTickerText(text), [text]);
  const hasUnsavedChanges = text !== originalText;

  const commitHeadlineItems = (nextItems) => {
    setHeadlineItems(nextItems);
    const serialized = nextItems
      .map((item) => item.trim())
      .filter(Boolean)
      .join(' • ');
    setText(serialized);
    if (error) setError('');
    if (feedback) setFeedback('');
  };

  const handleAddHeadline = () => {
    if (saving) {
      return;
    }
    const trimmed = newHeadline.trim();
    if (!trimmed) {
      setError('Please enter a headline to add.');
      return;
    }

    const base = headlineItems.map((item) => item.trim()).filter(Boolean);
    commitHeadlineItems([...base, trimmed]);
    setNewHeadline('');
  };

  const handleEditHeadline = (index, value) => {
    if (saving) {
      return;
    }
    const nextItems = headlineItems.map((item, idx) => (idx === index ? value : item));
    commitHeadlineItems(nextItems);
  };

  const handleMoveHeadline = (index, delta) => {
    if (saving) {
      return;
    }
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= headlineItems.length) {
      return;
    }

    const nextItems = [...headlineItems];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);
    commitHeadlineItems(nextItems);
  };

  const handleRemoveHeadline = (index) => {
    if (saving) {
      return;
    }
    const nextItems = headlineItems.filter((_, idx) => idx !== index);
    commitHeadlineItems(nextItems);
  };

  const handleRawTextChange = (value) => {
    if (saving) {
      return;
    }
    setText(value);
    setHeadlineItems(parseTickerText(value));
    if (error) setError('');
    if (feedback) setFeedback('');
  };

  const handleReset = () => {
    if (saving) {
      return;
    }
    setText(originalText);
    setHeadlineItems(parseTickerText(originalText));
    setNewHeadline('');
    setError('');
    setFeedback('Changes reset to original text.');
    showAndroidToast('Changes reset to original text.');
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const parsed = parseTickerText(text);
    if (parsed.length === 0) {
      setError('Ticker text cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');

    try {
      const response = await api.put('/api/ticker', { text: text.trim() });
      if (!isMountedRef.current) {
        return;
      }

      const savedText = String(response?.data?.data?.text ?? text.trim());
      setText(savedText);
      setOriginalText(savedText);
      setHeadlineItems(parseTickerText(savedText));
      setFeedback('Ticker updated successfully.');
      showAndroidToast('Ticker updated successfully.');
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to update ticker.'
      );
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (loading && !refreshing && !originalText && !error) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading news ticker..." size="lg" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTicker({ isRefresh: true })}
            colors={[COLORS.brandRed]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Live Breaking Bar</Text>
          <Text style={styles.heading}>Latest News Ticker</Text>
          <Text style={styles.subtitle}>
            Update the scrolling announcement headlines shown in the top header of A6News.
          </Text>
        </View>

        {feedback ? (
          <View style={styles.successBanner} accessibilityRole="text">
            <CheckCircle2 size={16} color={COLORS.green700} />
            <Text style={styles.successText}>{feedback}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => fetchTicker()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading ticker"
              style={({ pressed }) => [styles.retryButton, pressed && styles.neutralButtonPressed]}
            >
              <RefreshCw size={13} color={COLORS.brandRedDark} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Live Preview Card */}
        <View style={styles.card}>
          <View style={styles.previewHeader}>
            <Text style={styles.cardTitle}>Live Header Preview</Text>
            <View style={styles.teluguBadge}>
              <Text style={styles.teluguBadgeText}>తాజా వార్తలు</Text>
            </View>
          </View>

          <View style={styles.previewBar}>
            {previewItems.length > 0 ? (
              <TickerMarquee items={previewItems} />
            ) : (
              <Text style={styles.emptyPreviewText}>
                Enter ticker headlines below to see live preview...
              </Text>
            )}
          </View>
        </View>

        {/* Add & Structured Headline Editor */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Headlines ({headlineItems.length})</Text>

          <View style={styles.addRow}>
            <TextInput
              value={newHeadline}
              onChangeText={setNewHeadline}
              placeholder="Add a breaking news headline..."
              placeholderTextColor={COLORS.textPlaceholder}
              editable={!saving}
              returnKeyType="done"
              onSubmitEditing={handleAddHeadline}
              style={styles.addInput}
            />
            <Pressable
              onPress={handleAddHeadline}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Add Headline"
              style={({ pressed }) => [
                styles.addHeadlineButton,
                saving && styles.buttonDisabled,
                pressed && !saving && styles.addHeadlinePressed,
              ]}
            >
              <Plus size={16} color={COLORS.accentBlue} />
              <Text style={styles.addHeadlineText}>Add</Text>
            </Pressable>
          </View>

          {headlineItems.length === 0 ? (
            <View style={styles.emptyHeadlinesBox}>
              <Text style={styles.emptyHeadlinesText}>No ticker headlines yet.</Text>
            </View>
          ) : (
            <View style={styles.headlineList}>
              {headlineItems.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === headlineItems.length - 1;

                return (
                  <View key={`headline-${idx}`} style={styles.headlineRow}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>#{idx + 1}</Text>
                    </View>

                    <TextInput
                      value={item}
                      onChangeText={(val) => handleEditHeadline(idx, val)}
                      placeholder={`Headline ${idx + 1}`}
                      placeholderTextColor={COLORS.textPlaceholder}
                      editable={!saving}
                      accessibilityLabel={`Edit headline ${idx + 1}`}
                      style={styles.headlineInput}
                    />

                    <View style={styles.headlineActions}>
                      <Pressable
                        onPress={() => handleMoveHeadline(idx, -1)}
                        disabled={isFirst || saving}
                        accessibilityRole="button"
                        accessibilityLabel={`Move headline ${idx + 1} up`}
                        style={({ pressed }) => [
                          styles.iconButton,
                          (isFirst || saving) && styles.buttonDisabled,
                          pressed && !isFirst && !saving && styles.neutralButtonPressed,
                        ]}
                      >
                        <ArrowUp size={14} color={COLORS.textSecondary} />
                      </Pressable>

                      <Pressable
                        onPress={() => handleMoveHeadline(idx, 1)}
                        disabled={isLast || saving}
                        accessibilityRole="button"
                        accessibilityLabel={`Move headline ${idx + 1} down`}
                        style={({ pressed }) => [
                          styles.iconButton,
                          (isLast || saving) && styles.buttonDisabled,
                          pressed && !isLast && !saving && styles.neutralButtonPressed,
                        ]}
                      >
                        <ArrowDown size={14} color={COLORS.textSecondary} />
                      </Pressable>

                      <Pressable
                        onPress={() => handleRemoveHeadline(idx)}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove headline ${idx + 1}`}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          saving && styles.buttonDisabled,
                          pressed && !saving && styles.deleteButtonPressed,
                        ]}
                      >
                        <Trash2 size={14} color={COLORS.brandRedDark} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Raw Multiline Ticker Editor */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit Ticker Headlines</Text>
          <Text style={styles.fieldLabel}>Headlines Content</Text>
          <TextInput
            value={text}
            onChangeText={handleRawTextChange}
            placeholder="Enter each headline on a new line or separate with bullet points (•)..."
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!saving}
            accessibilityLabel="Headlines Content"
            style={styles.textArea}
          />
          <Text style={styles.tipText}>
            Tip: Place each breaking news item on a new line or separate with • bullets.
          </Text>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <Pressable
            onPress={handleReset}
            disabled={saving || !hasUnsavedChanges}
            accessibilityRole="button"
            accessibilityLabel="Reset"
            style={({ pressed }) => [
              styles.resetButton,
              (saving || !hasUnsavedChanges) && styles.buttonDisabled,
              pressed && !saving && hasUnsavedChanges && styles.neutralButtonPressed,
            ]}
          >
            <RotateCcw size={15} color={COLORS.textSecondary} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save Changes"
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.buttonDisabled,
              pressed && !saving && styles.saveButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Save size={15} color={COLORS.white} />
            )}
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  headerBlock: {
    gap: 2,
  },
  eyebrow: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heading: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.successBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  successText: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.green700,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  errorText: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  retryText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.brandRedDark,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.scale.baseSnug,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  teluguBadge: {
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  teluguBadgeText: {
    ...TYPOGRAPHY.scale.badge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  previewBar: {
    minHeight: 40,
    backgroundColor: COLORS.tickerBackground,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  emptyPreviewText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
    fontStyle: 'italic',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
  },
  addHeadlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    gap: 4,
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
  },
  addHeadlinePressed: {
    opacity: 0.85,
  },
  addHeadlineText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentBlue,
  },
  emptyHeadlinesBox: {
    backgroundColor: COLORS.gray50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyHeadlinesText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
  },
  headlineList: {
    gap: SPACING.sm,
    marginTop: 2,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  indexBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  headlineInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textPrimary,
  },
  headlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    backgroundColor: COLORS.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: COLORS.red100,
  },
  fieldLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 130,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
  },
  tipText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
  },
  footerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  resetButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  saveButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  saveButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  neutralButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
