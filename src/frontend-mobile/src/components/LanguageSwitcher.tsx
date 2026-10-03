import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  language: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'CN', label: '中文' },
  { value: 'EN', label: 'English' },
  { value: 'TR', label: 'Türkçe' },
];

export function LanguageSwitcher({ language, onChange, disabled = false }: LanguageSwitcherProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const active = option.value === language;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.9}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.button, active && styles.buttonActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  button: {
    flex: 1,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  label: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.primaryDark,
  },
});
