import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReasonPromptModal } from '../components/ReasonPromptModal';
import { StatusBadge } from '../components/StatusBadge';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useMerchantReservations } from '../context/MerchantReservationsContext';
import { getErrorMessage, isApiError, merchantAPI } from '../services/api';
import { Booking, BookingStatus, MerchantSummary } from '../types/api';
import { formatDateTime } from '../utils/datetime';
import { getLocalizedExperienceTitle } from '../utils/experience';
import { useFocusEffect } from '@react-navigation/native';

const FILTERS = ['pending', 'confirmed', 'past'] as const;

type ReservationsFilter = (typeof FILTERS)[number];

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

export function ReservationsScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const { refreshPendingCount } = useMerchantReservations();
  const [merchant, setMerchant] = useState<MerchantSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<ReservationsFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noCompany, setNoCompany] = useState(false);
  const [reasonPrompt, setReasonPrompt] = useState<{ booking: Booking; status: BookingStatus } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const query = useMemo(() => {
    if (filter === 'past') {
      return { scope: 'past' as const, limit: 100 };
    }

    return {
      status: (filter === 'pending' ? 'PENDING' : 'CONFIRMED') as BookingStatus,
      scope: 'upcoming' as const,
      limit: 100,
    };
  }, [filter]);

  const loadReservations = useCallback(async () => {
    try {
      const merchantResponse = await merchantAPI.getMe();
      setMerchant(merchantResponse.merchant);
      setNoCompany(false);

      const bookingsResponse = await merchantAPI.listBookings(query);
      setBookings(bookingsResponse.bookings || []);
      setCounts(bookingsResponse.counts || {});
      await refreshPendingCount();
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setNoCompany(true);
        setMerchant(null);
        setBookings([]);
        setCounts({});
      } else {
        Alert.alert(t('common.error'), getErrorMessage(error));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, refreshPendingCount, t]);

  useFocusEffect(
    useCallback(() => {
      void loadReservations();
    }, [loadReservations]),
  );

  const refreshList = () => {
    setRefreshing(true);
    void loadReservations();
  };

  const performStatusUpdate = async (booking: Booking, status: BookingStatus, reason?: string) => {
    setActionLoading(booking.id);
    try {
      await merchantAPI.updateBookingStatus(booking.id, { status, reason });
      await loadReservations();
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const promptForReason = (booking: Booking, status: BookingStatus) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('merchant.reasonPromptTitle'),
        t('merchant.reasonPromptDescription'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t(`merchant.${
              status === 'REJECTED'
                ? 'rejectAction'
                : status === 'CANCELLED'
                  ? 'cancelAction'
                  : 'noShowAction'
            }`),
            style: 'destructive',
            onPress: (value) => void performStatusUpdate(booking, status, value?.trim() || undefined),
          },
        ],
        'plain-text',
      );
      return;
    }

    setReasonPrompt({ booking, status });
  };

  const handleStatusAction = (booking: Booking, status: BookingStatus) => {
    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      Alert.alert(t('common.confirm'), t('merchant.statusUpdated'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => void performStatusUpdate(booking, status) },
      ]);
      return;
    }

    promptForReason(booking, status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (noCompany) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyShell}>
          <Text style={styles.emptyTitle}>{t('merchant.noCompanyTitle')}</Text>
          <Text style={styles.emptyMessage}>{t('merchant.noCompanyMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('merchant.title')}</Text>
          <Text style={styles.subtitle}>{merchant?.businessName}</Text>
        </View>
        <PrimaryButton title={`+ ${t('merchant.newReservation')}`} onPress={() => navigation.navigate('NewReservation')} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((value) => {
          const active = value === filter;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(value)}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{t(`merchant.${value}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helperText}>{t('merchant.filterHelp')}</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshList} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyShell}>
            <Text style={styles.emptyMessage}>{t('merchant.noReservations')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const customerName = item.guestName || item.user?.fullName || t('common.unknown');
          const customerPhone = item.guestPhone || item.user?.phone || '';
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{getLocalizedExperienceTitle(item.experience, language)}</Text>
                  <Text style={styles.cardSubtitle}>{formatDateTime(item.slotTime, language)}</Text>
                </View>
                <View style={styles.badges}>
                  <StatusBadge
                    label={t(`booking.source.${item.source === 'MANUAL' ? 'manual' : 'app'}`)}
                    backgroundColor={item.source === 'MANUAL' ? COLORS.secondary : COLORS.primaryDark}
                  />
                  <StatusBadge
                    label={t(`booking.status.${item.status === 'NO_SHOW' ? 'noShow' : item.status.toLowerCase()}`)}
                    backgroundColor={getStatusColor(item.status)}
                  />
                </View>
              </View>

              <Text style={styles.metaLine}>{t('merchant.customer')}: {customerName}</Text>
              <TouchableOpacity
                disabled={!customerPhone}
                onPress={() => customerPhone && Linking.openURL(`tel:${customerPhone}`)}
              >
                <Text style={[styles.metaLine, customerPhone && styles.phoneLink]}>
                  {customerPhone || t('merchant.phoneUnavailable')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.metaLine}>{t('detail.guests')}: {item.guestCount}</Text>
              {item.notes ? <Text style={styles.metaLine}>{t('merchant.notes')}: {item.notes}</Text> : null}
              {item.cancelReason ? <Text style={styles.metaLine}>{item.cancelReason}</Text> : null}

              <View style={styles.actions}>
                {item.status === 'PENDING' ? (
                  <>
                    <PrimaryButton
                      title={t('merchant.confirmAction')}
                      loading={actionLoading === item.id}
                      style={styles.flexAction}
                      onPress={() => handleStatusAction(item, 'CONFIRMED')}
                    />
                    <PrimaryButton
                      title={t('merchant.rejectAction')}
                      variant="secondary"
                      style={styles.flexAction}
                      onPress={() => handleStatusAction(item, 'REJECTED')}
                    />
                  </>
                ) : null}
                {item.status === 'CONFIRMED' ? (
                  <>
                    <PrimaryButton
                      title={t('merchant.completeAction')}
                      loading={actionLoading === item.id}
                      style={styles.flexAction}
                      onPress={() => handleStatusAction(item, 'COMPLETED')}
                    />
                    <PrimaryButton
                      title={t('merchant.noShowAction')}
                      variant="secondary"
                      style={styles.flexAction}
                      onPress={() => handleStatusAction(item, 'NO_SHOW')}
                    />
                    <PrimaryButton
                      title={t('merchant.cancelAction')}
                      variant="outline"
                      style={styles.flexAction}
                      onPress={() => handleStatusAction(item, 'CANCELLED')}
                    />
                  </>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ReasonPromptModal
        visible={Boolean(reasonPrompt)}
        title={t('merchant.reasonPromptTitle')}
        description={t('merchant.reasonPromptDescription')}
        placeholder={t('booking.notes')}
        confirmLabel={
          reasonPrompt
            ? t(
                `merchant.${
                  reasonPrompt.status === 'REJECTED'
                    ? 'rejectAction'
                    : reasonPrompt.status === 'CANCELLED'
                      ? 'cancelAction'
                      : 'noShowAction'
                }`,
              )
            : t('common.confirm')
        }
        loading={reasonPrompt ? actionLoading === reasonPrompt.booking.id : false}
        onCancel={() => setReasonPrompt(null)}
        onSubmit={(value) => {
          if (!reasonPrompt) {
            return;
          }

          const target = reasonPrompt;
          setReasonPrompt(null);
          void performStatusUpdate(target.booking, target.status, value || undefined);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    gap: SPACING.s,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  filterChip: {
    flex: 1,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterLabel: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: COLORS.white,
  },
  helperText: {
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.m,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  cardHeader: {
    gap: SPACING.s,
  },
  cardHeaderText: {
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  metaLine: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  phoneLink: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  flexAction: {
    flexGrow: 1,
  },
  emptyShell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.xxl,
    gap: SPACING.s,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
});
