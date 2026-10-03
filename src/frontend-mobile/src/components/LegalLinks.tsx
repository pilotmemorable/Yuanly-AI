import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_ORIGIN } from '../services/config';
import { BORDER_RADIUS, COLORS } from '../constants/theme';

interface LegalLinksProps {
  privacyLabel: string;
  termsLabel: string;
  supportLabel: string;
}

function openUrl(path: string) {
  return Linking.openURL(`${API_ORIGIN}${path}`);
}

export function LegalLinks({ privacyLabel, termsLabel, supportLabel }: LegalLinksProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.linkButton} onPress={() => openUrl('/privacy')}>
        <Text style={styles.linkText}>{privacyLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => openUrl('/terms')}>
        <Text style={styles.linkText}>{termsLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => openUrl('/support')}>
        <Text style={styles.linkText}>{supportLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkButton: {
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});
