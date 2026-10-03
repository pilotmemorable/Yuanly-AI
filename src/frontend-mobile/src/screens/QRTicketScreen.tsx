import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { PrimaryButton } from '../components/PrimaryButton';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { bookingAPI, getErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/datetime';
import { getLocalizedExperienceTitle } from '../utils/experience';

export function QRTicketScreen({ route }: any) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    void fetchTicket();
  }, [route.params?.bookingId]);

  const fetchTicket = async () => {
    try {
      const response = await bookingAPI.getQr(route.params?.bookingId);
      setTicket(response);
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!ticket?.booking || !ticket?.qrCode) {
      return;
    }

    await Share.share({
      message: `${typeof ticket.booking.experience === 'string' ? ticket.booking.experience : getLocalizedExperienceTitle(ticket.booking.experience, language)}\n${formatDateTime(
        ticket.booking.date || ticket.booking.slotTime,
        language,
      )}\nyuanly://ticket/${ticket.booking.id}/${ticket.qrCode}`,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingState}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!ticket?.booking || !ticket?.qrCode) {
    return (
      <SafeAreaView style={styles.loadingState}>
        <Text style={styles.emptyText}>{t('booking.qrUnavailable')}</Text>
      </SafeAreaView>
    );
  }

  const qrValue = `yuanly://ticket/${ticket.booking.id}/${ticket.qrCode}`;
  const experienceTitle =
    typeof ticket.booking.experience === 'string'
      ? ticket.booking.experience
      : getLocalizedExperienceTitle(ticket.booking.experience, language);
  const merchantName =
    typeof ticket.booking.merchant === 'string'
      ? ticket.booking.merchant
      : ticket.booking.merchant?.businessName || ticket.booking.experience?.merchant?.businessName;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.card}>
        <Text style={styles.brand}>Yuanly</Text>
        <View style={styles.qrWrapper}>
          <QRCode value={qrValue} size={220} color={COLORS.dark} backgroundColor={COLORS.white} />
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.title}>{experienceTitle}</Text>
          <Text style={styles.subtitle}>{merchantName}</Text>
          <Text style={styles.line}>{formatDateTime(ticket.booking.date || ticket.booking.slotTime, language)}</Text>
          <Text style={styles.line}>{t('detail.guests')}: {ticket.booking.guestCount}</Text>
        </View>
      </View>
      <PrimaryButton title={t('common.share') || 'Share'} onPress={() => void handleShare()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
    gap: SPACING.l,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.l,
  },
  brand: {
    color: COLORS.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
  qrWrapper: {
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.white,
  },
  infoBlock: {
    gap: SPACING.s,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  line: {
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
