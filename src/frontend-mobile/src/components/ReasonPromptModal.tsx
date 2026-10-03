import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { PrimaryButton } from './PrimaryButton';

interface ReasonPromptModalProps {
  visible: boolean;
  title: string;
  description?: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  loading?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

export function ReasonPromptModal({
  visible,
  title,
  description,
  placeholder,
  confirmLabel,
  initialValue = '',
  loading = false,
  secureTextEntry = false,
  multiline = true,
  onCancel,
  onSubmit,
}: ReasonPromptModalProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <TextInput
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary}
            style={[styles.input, !multiline && styles.singleLineInput]}
          />
          <View style={styles.actions}>
            <PrimaryButton title={t('common.cancel')} variant="secondary" style={styles.actionButton} onPress={onCancel} />
            <PrimaryButton
              title={confirmLabel}
              loading={loading}
              style={styles.actionButton}
              onPress={() => onSubmit(value.trim())}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.card,
    borderTopRightRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.m,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  input: {
    minHeight: 110,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    backgroundColor: COLORS.background,
  },
  singleLineInput: {
    minHeight: 52,
    textAlignVertical: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  actionButton: {
    flex: 1,
  },
});
