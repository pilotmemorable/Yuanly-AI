import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { Experience } from '../types/api';
import { Language } from '../i18n/translations';
import { getLocalizedExperienceTitle } from '../utils/experience';

interface ExperienceCardProps {
  experience: Experience;
  language: Language;
  onPress: () => void;
}

export function ExperienceCard({ experience, language, onPress }: ExperienceCardProps) {
  const title = getLocalizedExperienceTitle(experience, language);
  const image = experience.images?.[0];

  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.container} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderMark}>缘</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.location}>{experience.merchant?.location || 'Türkiye'}</Text>
          {experience.aiBadge ? <Text style={styles.aiBadge}>{experience.aiBadge}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.merchant} numberOfLines={1}>
          {experience.merchant?.businessName}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>¥{Number(experience.priceCny || 0)}</Text>
          <Text style={styles.rating}>★ {Number(experience.rating || 0).toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    overflow: 'hidden',
    marginBottom: SPACING.m,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.surfaceMuted,
  },
  placeholder: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMark: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  body: {
    padding: SPACING.m,
    gap: SPACING.s,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  aiBadge: {
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  merchant: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: '800',
  },
  rating: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
});
