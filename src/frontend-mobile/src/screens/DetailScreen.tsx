import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { bookingAPI, experienceAPI, getErrorMessage, isApiError } from '../services/api';
import { Experience, Slot } from '../types/api';
import { formatDateTime } from '../utils/datetime';
import { getLocalizedExperienceDescription, getLocalizedExperienceTitle } from '../utils/experience';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';

export function DetailScreen({ navigation, route }: any) {
  const { language, t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [experience, setExperience] = useState<Experience | null>(route.params?.experience ?? null);
  const [loading, setLoading] = useState(true);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  const experienceId = route.params?.experienceId ?? route.params?.experience?.id;
  const slots = experience?.slots || [];
  const reviews = experience?.reviews || [];

  useEffect(() => {
    void fetchExperience();
  }, [experienceId]);

  useEffect(() => {
    if (bookingVisible) {
      setGuestName(user?.fullName || '');
      setGuestPhone(user?.phone || '');
    }
  }, [bookingVisible, user?.fullName, user?.phone]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) || null,
    [selectedSlotId, slots],
  );

  useEffect(() => {
    if (selectedSlot) {
      setGuestCount((current) => Math.min(Math.max(1, current), Math.max(1, selectedSlot.remaining)));
    }
  }, [selectedSlot]);

  const fetchExperience = async () => {
    try {
      setLoading(true);
      const response = await experienceAPI.getDetail(experienceId);
      setExperience(response.experience);
      if (!selectedSlotId && response.experience?.slots?.[0]?.id) {
        setSelectedSlotId(response.experience.slots[0].id);
      }
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const openBookingSheet = () => {
    if (!selectedSlot) {
      Alert.alert(t('common.error'), t('detail.slotRequired'));
      return;
    }

    if (!isAuthenticated) {
      navigation.navigate('AuthPrompt', {
        title: t('auth.signInRequiredTitle'),
        message: t('booking.emptyGuestPromptMessage'),
      });
      return;
    }

    setBookingVisible(true);
  };

  const submitBooking = async () => {
    if (!experience || !selectedSlot) {
      return;
    }

    if (!guestName.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingAPI.create({
        experienceId: experience.id,
        slotId: selectedSlot.id,
        guestCount,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setBookingVisible(false);
      navigation.replace('BookingSuccess', {
        bookingId: response.booking.id,
        experienceTitle: getLocalizedExperienceTitle(experience, language),
      });
    } catch (error) {
      if (isApiError(error) && (error.errorCode === 'ERR_SLOT_TAKEN' || error.errorCode === 'ERR_CAPACITY_FULL')) {
        await fetchExperience();
      }
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !experience) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!experience) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.emptyText}>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedExperienceTitle(experience, language);
  const description = getLocalizedExperienceDescription(experience, language);
  const heroImage = experience.images?.[0];
  const totalAmount = Number((selectedSlot?.priceCny ?? experience.priceCny) || 0) * guestCount;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderMark}>缘</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.price}>¥{Number(experience.priceCny || 0)}</Text>
          <Text style={styles.payAtVenue}>{t('detail.payAtVenue')}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('detail.location')}</Text>
              <Text style={styles.infoValue}>{experience.merchant?.location || 'Türkiye'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('detail.duration')}</Text>
              <Text style={styles.infoValue}>{experience.duration || '—'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('detail.rating')}</Text>
              <Text style={styles.infoValue}>★ {Number(experience.rating || 0).toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('detail.description')}</Text>
            <Text style={styles.bodyText}>{description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('detail.availableSlots')}</Text>
            {slots.length ? (
              <FlatList
                horizontal
                data={slots}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slotList}
                renderItem={({ item }) => {
                  const active = item.id === selectedSlotId;
                  return (
                    <TouchableOpacity
                      style={[styles.slotChip, active && styles.slotChipActive]}
                      onPress={() => setSelectedSlotId(item.id)}
                    >
                      <Text style={[styles.slotDate, active && styles.slotTextActive]}>{formatDateTime(item.startTime, language)}</Text>
                      <Text style={[styles.slotMeta, active && styles.slotTextActive]}>
                        ¥{Number(item.priceCny)} · {item.remaining}/{item.capacity}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <Text style={styles.bodyText}>{t('detail.noSlots')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.guestRow}>
              <Text style={styles.sectionTitle}>{t('detail.guests')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setGuestCount((current) => Math.max(1, current - 1))}
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.guestCount}>{guestCount}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setGuestCount((current) => Math.min(selectedSlot?.remaining || current + 1, current + 1))
                  }
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.infoLabel}>{t('detail.total')}</Text>
              <Text style={styles.totalAmount}>¥{totalAmount}</Text>
            </View>
            <PrimaryButton title={t('detail.requestReservation')} onPress={openBookingSheet} disabled={!slots.length} />
          </View>

          {reviews.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('detail.reviews')}</Text>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.user?.fullName || t('common.unknown')}</Text>
                    <Text style={styles.reviewRating}>★ {review.rating}</Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={bookingVisible} transparent animationType="slide" onRequestClose={() => setBookingVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setBookingVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('detail.bookingSheetTitle')}</Text>
            {selectedSlot ? <Text style={styles.sheetSubtitle}>{formatDateTime(selectedSlot.startTime, language)}</Text> : null}
            <TextInput
              placeholder={t('booking.guestName')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={guestName}
              onChangeText={setGuestName}
            />
            <TextInput
              placeholder={`${t('booking.guestPhone')} (${t('common.optional')})`}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              keyboardType="phone-pad"
              value={guestPhone}
              onChangeText={setGuestPhone}
            />
            <TextInput
              placeholder={`${t('booking.notes')} (${t('common.optional')})`}
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.sheetHint}>{t('booking.pendingInfo')}</Text>
            <View style={styles.sheetActions}>
              <PrimaryButton
                title={t('common.cancel')}
                variant="secondary"
                style={styles.sheetButton}
                onPress={() => setBookingVisible(false)}
              />
              <PrimaryButton
                title={t('detail.requestReservation')}
                loading={submitting}
                style={styles.sheetButton}
                onPress={submitBooking}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  heroImage: {
    width: '100%',
    height: 260,
    backgroundColor: COLORS.surfaceMuted,
  },
  heroPlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderMark: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  content: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  payAtVenue: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.xs,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.m,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  bodyText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  slotList: {
    paddingRight: SPACING.s,
  },
  slotChip: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    marginRight: SPACING.s,
    minWidth: 180,
  },
  slotChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  slotDate: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  slotMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  slotTextActive: {
    color: COLORS.primaryDark,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: '800',
  },
  guestCount: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    color: COLORS.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.s,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    color: COLORS.text,
    fontWeight: '700',
  },
  reviewRating: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  reviewComment: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderTopLeftRadius: BORDER_RADIUS.card,
    borderTopRightRadius: BORDER_RADIUS.card,
    gap: SPACING.m,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: COLORS.textSecondary,
  },
  input: {
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
  },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  sheetHint: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  sheetButton: {
    flex: 1,
  },
});
