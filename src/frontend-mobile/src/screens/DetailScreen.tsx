import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, FlatList, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { experienceAPI, slotAPI, bookingAPI } from '../services/api';

const { width } = Dimensions.get('window');

export const DetailScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { experienceId, experience: passedExp } = route.params || {};

  const [experience, setExperience] = useState<any>(passedExp || null);
  const [slots, setSlots] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [experienceId]);

  const fetchDetails = async () => {
    try {
      if (experienceId) {
        const res = await experienceAPI.getDetail(experienceId);
        setExperience(res.experience);
        setSlots(res.experience.slots || []);
        setReviews(res.experience.reviews || []);
      }
    } catch (error) {
      console.error('[Detail] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async () => {
    if (!selectedSlot) {
      Alert.alert(t('common.error'), t('detail.selectSlot'));
      return;
    }

    setBookingLoading(true);
    try {
      const holdRes = await bookingAPI.holdSlot(experience.id, selectedSlot, guestCount);
      if (holdRes.error_code === 'ERR_SLOT_TAKEN') {
        Alert.alert(t('common.error'), t('detail.availableSlots') + ' changed');
        fetchDetails();
        return;
      }
      // Navigate to payment
      navigation.navigate('Payment', {
        bookingId: holdRes.bookingId,
        holdId: holdRes.holdId,
        totalAmount: holdRes.totalAmount,
        experienceTitle: experience.titleCn || experience.title,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !experience) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const exp = experience || {};
  const title = exp.titleCn || exp.title || '';
  const description = exp.descriptionCn || exp.description || '';
  const price = Number(exp.priceCny || 0);
  const image = exp.images?.[0] || '';
  const merchant = exp.merchant || {};

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>¥{price} CNY</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('detail.location')}</Text>
            <Text style={styles.infoValue}>{merchant.location || 'Turkey'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('detail.duration')}</Text>
            <Text style={styles.infoValue}>{exp.duration || '—'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('detail.rating')}</Text>
            <Text style={styles.infoValue}>⭐ {exp.rating || '0.0'}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{t('detail.description')}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Available Slots */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{t('detail.availableSlots')}</Text>
        {slots.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={slots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.slotChip, selectedSlot === item.id && styles.slotChipSelected]}
                onPress={() => setSelectedSlot(item.id)}
              >
                <Text style={[styles.slotDate, selectedSlot === item.id && styles.slotTextSelected]}>
                  {formatDate(item.startTime)}
                </Text>
                <Text style={[styles.slotPrice, selectedSlot === item.id && styles.slotTextSelected]}>
                  ¥{Number(item.priceCny)}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.slotList}
          />
        ) : (
          <Text style={styles.noSlots}>No slots available for the next 7 days</Text>
        )}

        {/* Guest count */}
        <View style={styles.guestContainer}>
          <Text style={styles.guestLabel}>{t('detail.guests')}</Text>
          <View style={styles.guestControls}>
            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuestCount(Math.max(1, guestCount - 1))}>
              <Text style={styles.guestBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.guestCount}>{guestCount}</Text>
            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuestCount(guestCount + 1)}>
              <Text style={styles.guestBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total */}
        {selectedSlot && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('detail.total')}</Text>
            <Text style={styles.totalAmount}>¥{price * guestCount} CNY</Text>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('detail.reviewsTitle')} ({exp.reviewCount || reviews.length})</Text>
            {reviews.slice(0, 3).map((review, i) => (
              <View key={review.id || i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.user?.fullName || 'Anonymous'}</Text>
                  <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.bookButton, (!selectedSlot || bookingLoading) && styles.bookButtonDisabled]}
          onPress={handleBookNow}
          disabled={!selectedSlot || bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.bookButtonText}>{t('detail.bookNow')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: width, height: 400 },
  content: { padding: SPACING.l, marginTop: -30, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  price: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.surface, marginVertical: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  description: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 8 },
  slotList: { paddingRight: SPACING.l },
  slotChip: {
    backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 15, marginRight: 10, borderWidth: 2, borderColor: 'transparent',
  },
  slotChipSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(64, 224, 208, 0.1)' },
  slotDate: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  slotPrice: { fontSize: 16, color: COLORS.primary, fontWeight: 'bold' },
  slotTextSelected: { color: COLORS.primary },
  noSlots: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  guestContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  guestLabel: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  guestControls: { flexDirection: 'row', alignItems: 'center' },
  guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  guestBtnText: { fontSize: 24, color: COLORS.primary, fontWeight: 'bold' },
  guestCount: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginHorizontal: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.surface },
  totalLabel: { fontSize: 18, color: COLORS.textSecondary },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  reviewCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 15, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewUser: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  reviewRating: { fontSize: 14, color: COLORS.secondary },
  reviewComment: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  bookButton: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: BORDER_RADIUS.button, alignItems: 'center',
    marginTop: 20, marginBottom: 40,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  bookButtonDisabled: { opacity: 0.5 },
  bookButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});