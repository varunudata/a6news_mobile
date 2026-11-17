import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';

import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';

export function SelectModal({
  label,
  value,
  options = [],
  onValueChange,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  style,
  triggerStyle,
}) {
  const [visible, setVisible] = useState(false);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { label: String(opt.label ?? opt.name ?? opt.value ?? ''), value: opt.value ?? opt.id }
      : { label: String(opt), value: opt }
  );

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const openModal = () => {
    if (!disabled) setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const handleSelect = (selectedVal) => {
    onValueChange?.(selectedVal);
    onChange?.(selectedVal);
    closeModal();
  };

  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        onPress={openModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
          triggerStyle,
        ]}>
        <Text
          style={[styles.triggerText, !selectedOption && styles.placeholderText]}
          numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={COLORS.textMeta} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {label || placeholder}
              </Text>
              <Pressable
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close selection"
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedBtn]}>
                <X size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.optionsList} bounces={false}>
              {normalizedOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <Pressable
                    key={`${String(opt.value)}-${idx}`}
                    onPress={() => handleSelect(opt.value)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      idx > 0 && styles.optionRowBorder,
                      isSelected && styles.optionRowSelected,
                      pressed && !isSelected && styles.optionRowPressed,
                    ]}>
                    <Text
                      style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      numberOfLines={2}>
                      {opt.label}
                    </Text>
                    {isSelected ? <Check size={16} color={COLORS.brandRed} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.sm,
  },
  triggerDisabled: {
    backgroundColor: COLORS.gray100,
    opacity: 0.7,
  },
  triggerPressed: {
    borderColor: COLORS.brandRed,
  },
  triggerText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textBody,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textPlaceholder,
  },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.borderCard,
    gap: SPACING.sm,
  },
  modalTitle: {
    ...TYPOGRAPHY.scale.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  pressedBtn: {
    backgroundColor: COLORS.gray100,
  },
  optionsList: {
    maxHeight: 340,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  optionRowBorder: {
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.borderSubtle,
  },
  optionRowSelected: {
    backgroundColor: COLORS.red50,
  },
  optionRowPressed: {
    backgroundColor: COLORS.gray50,
  },
  optionLabel: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textBody,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  optionLabelSelected: {
    color: COLORS.brandRed,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default SelectModal;
