import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { bookingAPI } from '../services/api';

export const MyTripsScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.list();
      setBookings(res.bookings || []);
    } catch (error) {
      console.error('[MyTrips] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      t('booking.cancel'),
      'Are you sure?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(bookingId);
              fetchBookings();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
          },
        },
      ]
    );
  };

  const now = new Date();
  const filtered = bookings.filter(b => {
    const isPast = b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REFUNDED' || new Date(b.slotTime) < now;
    return filter === 'upcoming' ? !isPast : isPast;
  });

  const statusColors: Record<string, string> = {
    PENDING: '#FF9800',
    CONFIRMED: '#4CAF50',
    COMPLETED: '#2196F3',
    CANCELLED: '#F44336',
    REFUNDED: '#9E9E9E',
  };

  const renderItem = ({ item }: { item: any }) => {
    const exp = item.experience || {};
    const merchant = exp.merchant || {};
    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTitle}>{exp.titleCn || exp.title || 'Experience'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#999' }]}>
            <Text style={styles.statusText}>{t(`booking.${item.status.toLowerCase()}`)}</Text>
          </View>
        </View>

        <Text style={styles.bookingMerchant}>{merchant.businessName}</Text>
        <Text style={styles.bookingDate}>{new Date(item.slotTime).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingPrice}>¥{Number(item.totalAmount)} CNY</Text>
          <Text style={styles.bookingGuests}>{item.guestCount} {t('detail.guests')}</Text>
        </View>

        <View style={styles.bookingActions}>
          {item.status === 'CONFIRMED' && item.qrCode && (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => navigation.navigate('QRTicket', { bookingId: item.id })}
            >
              <Text style={styles.qrButtonText}>{t('booking.viewQR')}</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelButtonText}>{t('booking.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('booking.myTrips')}</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, filter === 'upcoming' && styles.tabActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.tabText, filter === 'upcoming' && styles.tabTextActive]}>{t('booking.upcoming')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'past' && styles.tabActive]}
            onPress={() => setFilter('past')}
          >
            <Text style={[styles.tabText, filter === 'past' && styles.tabTextActive]}>{t('booking.past')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('booking.noTrips')}</Text>
            <Text style={styles.emptySubtext}>{t('booking.startExploring')}</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.exploreButtonText}>{t('tab.explore')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.l, marginTop: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 15, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  listContent: { padding: SPACING.l },
  bookingCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bookingTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  bookingMerchant: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  bookingDate: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bookingPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  bookingGuests: { fontSize: 14, color: COLORS.textSecondary },
  bookingActions: { flexDirection: 'row', gap: 12 },
  qrButton: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  qrButtonText: { color: COLORS.white, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F44336' },
  cancelButtonText: { color: '#F44336', fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20, textAlign: 'center' },
  exploreButton: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: BORDER_RADIUS.button },
  exploreButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});