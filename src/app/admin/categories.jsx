import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
  FolderKanban,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';

import { Loader } from '@/components/shared/Loader';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

const ACCENT_BLUE = '#1D4ED8';
const ACCENT_BLUE_BG = '#EFF6FF';
const ACCENT_BLUE_BORDER = '#BFDBFE';

function showAndroidToast(message) {
  if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

/**
 * Admin Categories Management screen (/admin/categories).
 * Supports listing, search filtering, creation, deletion with modal confirmation,
 * and Up/Down reordering saved via PUT /api/categories/reorder.
 */
export default function AdminCategoriesScreen() {
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const [categories, setCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCategories = useCallback(async ({ isRefresh = false } = {}) => {
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
      const response = await api.get('/api/categories');
      if (!isMountedRef.current) {
        return;
      }

      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(list);
      setOriginalCategories(list);
      setOrderChanged(false);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load categories.'
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
    fetchCategories();
  }, [fetchCategories]);

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;
  const isMutating = savingOrder || adding || deleting;

  const filteredCategories = useMemo(() => {
    if (!trimmedSearch) {
      return categories;
    }
    const query = trimmedSearch.toLowerCase();
    return categories.filter((cat) => String(cat?.name || '').toLowerCase().includes(query));
  }, [categories, trimmedSearch]);

  const moveCategory = (index, delta) => {
    if (isSearching || isMutating) {
      return;
    }
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= categories.length) {
      return;
    }

    setCategories((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setOrderChanged(true);
    setFeedback('');
    setError('');
  };

  const handleResetOrder = () => {
    if (isMutating || !orderChanged) {
      return;
    }
    setCategories(originalCategories);
    setOrderChanged(false);
    setError('');
    setFeedback('Category order changes discarded.');
    showAndroidToast('Category order reset.');
  };

  const handleSaveOrder = async () => {
    if (savingOrder || !orderChanged || isSearching) {
      return;
    }

    setSavingOrder(true);
    setError('');
    setFeedback('');

    try {
      const order = categories.map((cat, index) => ({
        id: cat.id,
        sortOrder: index,
      }));
      await api.put('/api/categories/reorder', { order });
      if (!isMountedRef.current) {
        return;
      }

      setOrderChanged(false);
      await fetchCategories({ isRefresh: true });
      if (isMountedRef.current) {
        setFeedback('Category order updated successfully.');
        showAndroidToast('Category order updated successfully.');
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to save category order.'
      );
    } finally {
      if (isMountedRef.current) {
        setSavingOrder(false);
      }
    }
  };

  const openAddModal = () => {
    if (isMutating) {
      return;
    }
    setNewCategoryName('');
    setAddError('');
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    if (adding) {
      return;
    }
    setAddModalVisible(false);
    setAddError('');
  };

  const handleAddCategory = async () => {
    if (adding) {
      return;
    }

    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setAddError('Name cannot be empty.');
      return;
    }

    setAdding(true);
    setAddError('');
    setError('');
    setFeedback('');

    try {
      await api.post('/api/categories', { name: trimmedName });
      if (!isMountedRef.current) {
        return;
      }

      setAddModalVisible(false);
      setNewCategoryName('');
      await fetchCategories({ isRefresh: true });
      if (isMountedRef.current) {
        setFeedback('New category created successfully.');
        showAndroidToast('New category created successfully.');
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setAddError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create category.'
      );
    } finally {
      if (isMountedRef.current) {
        setAdding(false);
      }
    }
  };

  const openDeleteModal = (category) => {
    if (isMutating) {
      return;
    }
    setDeleteTarget(category);
  };

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) {
      return;
    }

    setDeleting(true);
    setError('');
    setFeedback('');

    try {
      await api.delete(`/api/categories/${deleteTarget.id}`);
      if (!isMountedRef.current) {
        return;
      }

      setDeleteTarget(null);
      await fetchCategories({ isRefresh: true });
      if (isMountedRef.current) {
        setFeedback('Category deleted successfully.');
        showAndroidToast('Category deleted successfully.');
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setDeleteTarget(null);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to delete category.'
      );
    } finally {
      if (isMountedRef.current) {
        setDeleting(false);
      }
    }
  };

  if (loading && !refreshing && categories.length === 0 && !error) {
    return (
      <View style={styles.centerState}>
        <Loader label="Loading categories..." size="lg" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCategories({ isRefresh: true })}
            colors={[COLORS.brandRed]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Navigation &amp; Taxonomy</Text>
            <Text style={styles.heading}>Categories ({categories.length})</Text>
          </View>

          <View style={styles.headerActions}>
            {orderChanged && !isSearching ? (
              <>
                <Pressable
                  onPress={handleResetOrder}
                  disabled={isMutating}
                  accessibilityRole="button"
                  accessibilityLabel="Reset Order"
                  style={({ pressed }) => [
                    styles.resetOrderButton,
                    isMutating && styles.buttonDisabled,
                    pressed && !isMutating && styles.neutralButtonPressed,
                  ]}
                >
                  <RotateCcw size={14} color={COLORS.textSecondary} />
                  <Text style={styles.resetOrderButtonText}>Reset Order</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveOrder}
                  disabled={isMutating}
                  accessibilityRole="button"
                  accessibilityLabel="Save Order"
                  style={({ pressed }) => [
                    styles.saveOrderButton,
                    isMutating && styles.buttonDisabled,
                    pressed && !isMutating && styles.saveOrderButtonPressed,
                  ]}
                >
                  {savingOrder ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Save size={15} color={COLORS.white} />
                  )}
                  <Text style={styles.saveOrderButtonText}>
                    {savingOrder ? 'Saving...' : 'Save Order'}
                  </Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              onPress={openAddModal}
              disabled={isMutating}
              accessibilityRole="button"
              accessibilityLabel="Add Category"
              style={({ pressed }) => [
                styles.addButton,
                isMutating && styles.buttonDisabled,
                pressed && !isMutating && styles.addButtonPressed,
              ]}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Category</Text>
            </Pressable>
          </View>
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
              onPress={() => fetchCategories()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading categories"
              style={({ pressed }) => [styles.retryButton, pressed && styles.neutralButtonPressed]}
            >
              <RefreshCw size={13} color={COLORS.brandRedDark} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={17} color={COLORS.textPlaceholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories..."
            placeholderTextColor={COLORS.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {isSearching ? (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear category search"
              style={styles.clearButton}
            >
              <X size={16} color={COLORS.textMeta} />
            </Pressable>
          ) : null}
        </View>

        {/* Reorder Guidance */}
        {!isSearching && categories.length > 1 ? (
          <View style={styles.tipBanner}>
            <Text style={styles.tipText}>
              Use the Up / Down arrows to reorder navbar categories, then tap “Save Order”.
            </Text>
          </View>
        ) : null}

        {/* List */}
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyCard}>
            <FolderKanban size={30} color={COLORS.textPlaceholder} />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredCategories.map((cat, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === filteredCategories.length - 1;
              const sortOrderDisplay = isSearching ? cat.sortOrder ?? idx : idx;

              return (
                <View key={String(cat.id)} style={styles.categoryCard}>
                  <View style={styles.categoryMain}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>#{idx + 1}</Text>
                    </View>

                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName} numberOfLines={2}>
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryMeta}>
                        ID: {cat.id} · Order: {sortOrderDisplay}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowActions}>
                    {!isSearching ? (
                      <>
                        <Pressable
                          onPress={() => moveCategory(idx, -1)}
                          disabled={isFirst || isMutating}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${cat.name} up`}
                          style={({ pressed }) => [
                            styles.iconButton,
                            (isFirst || isMutating) && styles.buttonDisabled,
                            pressed && !isFirst && !isMutating && styles.neutralButtonPressed,
                          ]}
                        >
                          <ArrowUp size={16} color={COLORS.textSecondary} />
                        </Pressable>

                        <Pressable
                          onPress={() => moveCategory(idx, 1)}
                          disabled={isLast || isMutating}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${cat.name} down`}
                          style={({ pressed }) => [
                            styles.iconButton,
                            (isLast || isMutating) && styles.buttonDisabled,
                            pressed && !isLast && !isMutating && styles.neutralButtonPressed,
                          ]}
                        >
                          <ArrowDown size={16} color={COLORS.textSecondary} />
                        </Pressable>
                      </>
                    ) : null}

                    <Pressable
                      onPress={() => openDeleteModal(cat)}
                      disabled={isMutating}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${cat.name}`}
                      style={({ pressed }) => [
                        styles.deleteIconButton,
                        isMutating && styles.buttonDisabled,
                        pressed && !isMutating && styles.deleteIconPressed,
                      ]}
                    >
                      <Trash2 size={16} color={COLORS.brandRedDark} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAddModal} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add New Category</Text>
              <Pressable
                onPress={closeAddModal}
                disabled={adding}
                accessibilityRole="button"
                accessibilityLabel="Close Add Category modal"
                style={({ pressed }) => [styles.closeBtn, pressed && styles.neutralButtonPressed]}
              >
                <X size={18} color={COLORS.textMuted} />
              </Pressable>
            </View>

            {addError ? (
              <View style={styles.modalErrorBanner} accessibilityRole="alert">
                <Text style={styles.modalErrorText}>{addError}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category Name</Text>
              <TextInput
                value={newCategoryName}
                onChangeText={(val) => {
                  setNewCategoryName(val);
                  if (addError) setAddError('');
                }}
                placeholder="e.g. INDUSTRIAL CORRIDORS"
                placeholderTextColor={COLORS.textPlaceholder}
                editable={!adding}
                returnKeyType="done"
                onSubmitEditing={handleAddCategory}
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeAddModal}
                disabled={adding}
                accessibilityRole="button"
                accessibilityLabel="Cancel Add Category"
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  adding && styles.buttonDisabled,
                  pressed && !adding && styles.neutralButtonPressed,
                ]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddCategory}
                disabled={adding}
                accessibilityRole="button"
                accessibilityLabel={adding ? 'Adding category' : 'Confirm Add Category'}
                style={({ pressed }) => [
                  styles.modalPrimaryButton,
                  adding && styles.buttonDisabled,
                  pressed && !adding && styles.addButtonPressed,
                ]}
              >
                {adding ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
                <Text style={styles.modalPrimaryText}>
                  {adding ? 'Adding...' : 'Add Category'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        visible={Boolean(deleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDeleteModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Delete category?</Text>
            <Text style={styles.modalDescription}>
              This action is permanent and cannot be undone. Categories with associated posts
              cannot be deleted.
            </Text>

            {deleteTarget?.name ? (
              <Text style={styles.modalTargetName} numberOfLines={2}>
                "{deleteTarget.name}"
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeDeleteModal}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Cancel Delete Category"
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  deleting && styles.buttonDisabled,
                  pressed && !deleting && styles.neutralButtonPressed,
                ]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel={deleting ? 'Deleting category' : 'Confirm Delete Category'}
                style={({ pressed }) => [
                  styles.modalPrimaryButton,
                  deleting && styles.buttonDisabled,
                  pressed && !deleting && styles.addButtonPressed,
                ]}
              >
                {deleting ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
                <Text style={styles.modalPrimaryText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  headerSection: {
    gap: SPACING.md,
  },
  titleBlock: {
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
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  addButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  addButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  saveOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ACCENT_BLUE,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  saveOrderButtonPressed: {
    opacity: 0.88,
  },
  saveOrderButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  resetOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  resetOrderButtonText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F0FDF4',
    borderWidth: LAYOUT.borderWidth,
    borderColor: '#BBF7D0',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    padding: 4,
  },
  tipBanner: {
    backgroundColor: ACCENT_BLUE_BG,
    borderWidth: LAYOUT.borderWidth,
    borderColor: ACCENT_BLUE_BORDER,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tipText: {
    ...TYPOGRAPHY.scale.xs,
    color: ACCENT_BLUE,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMeta,
  },
  list: {
    gap: SPACING.sm,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  indexBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray100,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  indexBadgeText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  categoryMeta: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.textMeta,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    backgroundColor: COLORS.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconPressed: {
    backgroundColor: COLORS.red100,
  },
  neutralButtonPressed: {
    backgroundColor: COLORS.gray100,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  modalHeading: {
    ...TYPOGRAPHY.scale.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorBanner: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  modalErrorText: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  modalDescription: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  modalTargetName: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.gray50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  modalInput: {
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  modalCancelText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  modalPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  modalPrimaryText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
