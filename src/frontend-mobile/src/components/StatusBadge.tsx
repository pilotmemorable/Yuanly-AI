import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS } from '../constants/theme';

interface StatusBadgeProps {
  label: string;
  backgroundColor: string;
  color?: string;
}

export function StatusBadge({ label, backgroundColor, color = COLORS.white }: StatusBadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
