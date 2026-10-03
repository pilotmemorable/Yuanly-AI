import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

export function BookingSuccessScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const experienceTitle = route.params?.experienceTitle;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
        <Text style={styles.title}>{t('booking.successTitle')}</Text>
        <Text style={styles.subtitle}>{experienceTitle}</Text>
        <Text style={styles.message}>{t('booking.successMessage')}</Text>
        <View style={styles.actions}>
          <PrimaryButton
            title={t('booking.viewMyTrips')}
            onPress={() => navigation.navigate('MainTabs', { screen: 'MyTrips' })}
          />
          <PrimaryButton
            title={t('booking.backToExplore')}
            variant="outline"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Explore' })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.xl,
    gap: SPACING.m,
    alignItems: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.primaryDark,
    fontSize: 38,
    fontWeight: '800',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: SPACING.s,
  },
});
