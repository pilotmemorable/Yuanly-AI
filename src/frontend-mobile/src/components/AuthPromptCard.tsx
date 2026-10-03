import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface AuthPromptCardProps {
  title: string;
  message: string;
  signInLabel: string;
  createAccountLabel: string;
  onLogin: () => void;
  onRegister: () => void;
}

export function AuthPromptCard({
  title,
  message,
  signInLabel,
  createAccountLabel,
  onLogin,
  onRegister,
}: AuthPromptCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <PrimaryButton title={signInLabel} onPress={onLogin} />
      <PrimaryButton title={createAccountLabel} variant="outline" style={styles.secondaryButton} onPress={onRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.m,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryButton: {
    marginTop: 4,
  },
});
