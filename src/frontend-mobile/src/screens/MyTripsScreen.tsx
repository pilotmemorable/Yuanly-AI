import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthPromptCard } from '../components/AuthPromptCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReasonPromptModal } from '../components/ReasonPromptModal';
import { StatusBadge } from '../components/StatusBadge';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { bookingAPI, getErrorMessage } from '../services/api';
import { Booking, BookingStatus } from '../types/api';
import { formatDateTime } from '../utils/datetime';
import { getLocalizedExperienceTitle } from '../utils/experience';
import { useFocusEffect } from '@react-navigation/native';

const PAST_STATUSES: BookingStatus[] = ['REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

function getStatusColor(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return COLORS.warning;
    case 'CONFIRMED':
      return COLORS.success;
    case 'REJECTED':
    case 'CANCELLED':
      return COLORS.danger;
    case 'COMPLETED':
      return COLORS.primaryDark;
    case 'NO_SHOW':
      return COLORS.textSecondary;
    default:
      return COLORS.textSecondary;
  }
}

export function MyTripsScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) {
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await bookingAPI.list({ limit: 100 });
      setBookings(response.bookings || []);
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, t]);

  useFocusEffect(
    useCallback(() => {
      void fetchBookings();
    }, [fetchBookings]),
  );

  const filteredBookings = useMemo(() => {
    const now = Date.now();
    return bookings.filter((booking) => {
      const isPast = PAST_STATUSES.includes(booking.status) || new Date(booking.slotTime).getTime() < now;
      return filter === 'upcoming' ? !isPast : isPast;
    });
  }, [bookings, filter]);

  const confirmCancel = (booking: Booking) => {
    Alert.alert(t('booking.cancelConfirmTitle'), t('booking.cancelConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('booking.cancel'),
        style: 'destructive',
        onPress: () => setBookingToCancel(booking),
      },
    ]);
  };

  const submitCancellation = async (reason: string) => {
    if (!bookingToCancel) {
      return;
    }

    setCancelLoading(true);
    try {
      await bookingAPI.cancel(bookingToCancel.id, reason || undefined);
      setBookingToCancel(null);
      await fetchBookings();
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setCancelLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestState}>
          <AuthPromptCard
            title={t('auth.signInRequiredTitle')}
            message={t('booking.emptyGuestPromptMessage')}
            signInLabel={t('common.signIn')}
            createAccountLabel={t('common.createAccount')}
            onLogin={() => navigation.navigate('Login')}
            onRegister={() => navigation.navigate('Register')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('booking.myTrips')}</Text>
        <View style={styles.segmentedControl}>
          {(['upcoming', 'past'] as const).map((value) => {
            const active = value === filter;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                onPress={() => setFilter(value)}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {t(`booking.${value}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchBookings(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('booking.noTrips')}</Text>
            <Text style={styles.emptyMessage}>{t('booking.startExploring')}</Text>
            <PrimaryButton title={t('tab.explore')} onPress={() => navigation.navigate('Explore')} />
          </View>
        }
        renderItem={({ item }) => {
          const canCancel = item.status === 'PENDING' || item.status === 'CONFIRMED';
          const canShowQr = item.status === 'CONFIRMED';
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle}>{getLocalizedExperienceTitle(item.experience, language)}</Text>
                  <Text style={styles.cardSubtitle}>{item.experience.merchant.businessName}</Text>
                </View>
                <StatusBadge
                  label={t(`booking.status.${item.status === 'NO_SHOW' ? 'noShow' : item.status.toLowerCase()}`)}
                  backgroundColor={getStatusColor(item.status)}
                />
              </View>

              <Text style={styles.cardLine}>{formatDateTime(item.slotTime, language)}</Text>
              <Text style={styles.cardLine}>{t('detail.guests')}: {item.guestCount}</Text>
              <Text style={styles.cardLine}>{t('booking.payAtVenue')}</Text>
              {item.cancelReason ? <Text style={styles.cardLine}>{item.cancelReason}</Text> : null}

              <View style={styles.actions}>
                {canShowQr ? (
                  <PrimaryButton
                    title={t('booking.viewQr')}
                    variant="outline"
                    style={styles.flexButton}
                    onPress={() => navigation.navigate('QRTicket', { bookingId: item.id })}
                  />
                ) : null}
                {canCancel ? (
                  <PrimaryButton
                    title={t('booking.cancel')}
                    variant="secondary"
                    style={styles.flexButton}
                    onPress={() => confirmCancel(item)}
                  />
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ReasonPromptModal
        visible={Boolean(bookingToCancel)}
        title={t('booking.cancel')}
        description={t('booking.cancelReasonPrompt')}
        placeholder={t('booking.notes')}
        confirmLabel={t('booking.cancel')}
        loading={cancelLoading}
        onCancel={() => setBookingToCancel(null)}
        onSubmit={(value) => void submitCancellation(value)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestState: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    gap: SPACING.m,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.button,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.button,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.surface,
  },
  segmentLabel: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  segmentLabelActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xxl,
    gap: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
  },
  cardLine: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  flexButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: SPACING.m,
    paddingTop: SPACING.xxl,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyMessage: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
