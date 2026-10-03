import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { getErrorMessage, isApiError, merchantAPI } from '../services/api';
import { MerchantMeResponse } from '../types/api';
import { istanbulIsoFromParts } from '../utils/datetime';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getNextIstanbulDates() {
  const base = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const dates: string[] = [];
  for (let index = 0; index < 14; index += 1) {
    const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + index));
    dates.push(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`);
  }
  return dates;
}

function buildTimes() {
  const times: string[] = [];
  for (let hour = 8; hour <= 22; hour += 1) {
    ['00', '30'].forEach((minute) => {
      if (hour === 22 && minute === '30') {
        return;
      }
      times.push(`${pad(hour)}:${minute}`);
    });
  }
  return times;
}

function formatDateChip(dateStr: string, language: 'CN' | 'EN' | 'TR') {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (language === 'CN') {
    return `${month}月${day}日`;
  }
  if (language === 'TR') {
    return `${day}.${month}`;
  }
  return `${month}/${day}`;
}

export function NewReservationScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantMeResponse | null>(null);
  const [noCompany, setNoCompany] = useState(false);
  const [selectedExperienceId, setSelectedExperienceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getNextIstanbulDates()[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [guestCount, setGuestCount] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    void loadMerchantData();
  }, []);

  const dates = useMemo(() => getNextIstanbulDates(), []);
  const timeOptions = useMemo(() => buildTimes(), []);
  const activeExperiences = useMemo(
    () => (merchantData?.experiences || []).filter((experience) => experience.isActive),
    [merchantData?.experiences],
  );
  const selectedExperience = activeExperiences.find((experience) => experience.id === selectedExperienceId) || null;
  const capacityLimit = selectedExperience?.capacity || 20;

  const loadMerchantData = async () => {
    try {
      const response = await merchantAPI.getMe();
      setMerchantData(response);
      setNoCompany(false);
      const nextExperience = response.experiences?.find((experience: any) => experience.isActive)?.id;
      if (nextExperience) {
        setSelectedExperienceId(nextExperience);
      }
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        setNoCompany(true);
      } else {
        Alert.alert(t('common.error'), getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReservation = async () => {
    if (!selectedExperienceId) {
      Alert.alert(t('common.error'), t('merchant.selectExperience'));
      return;
    }

    if (!guestName.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await merchantAPI.createBooking({
        experienceId: selectedExperienceId,
        startTime: istanbulIsoFromParts(selectedDate, selectedTime),
        guestCount,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert(t('common.ok'), t('merchant.createSuccess'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
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
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>{t('merchant.noCompanyTitle')}</Text>
        <Text style={styles.emptyMessage}>{t('merchant.noCompanyMessage')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('merchant.selectExperience')}</Text>
            {activeExperiences.length ? (
              activeExperiences.map((experience) => {
                const active = experience.id === selectedExperienceId;
                return (
                  <TouchableOpacity
                    key={experience.id}
                    style={[styles.selectionCard, active && styles.selectionCardActive]}
                    onPress={() => setSelectedExperienceId(experience.id)}
                  >
                    <Text style={[styles.selectionTitle, active && styles.selectionTitleActive]}>
                      {language === 'CN' && experience.titleCn ? experience.titleCn : experience.title}
                    </Text>
                    <Text style={styles.selectionSubtitle}>¥{experience.priceCny} · {experience.capacity}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyMessage}>{t('merchant.emptyExperiences')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('merchant.selectDay')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {dates.map((date) => {
                const active = date === selectedDate;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatDateChip(date, language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('merchant.selectTime')}</Text>
            <View style={styles.wrapRow}>
              {timeOptions.map((time) => {
                const active = time === selectedTime;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.stepperRow}>
              <Text style={styles.sectionTitle}>{t('detail.guests')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepButton} onPress={() => setGuestCount((current) => Math.max(1, current - 1))}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.countText}>{guestCount}</Text>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => setGuestCount((current) => Math.min(capacityLimit, current + 1))}
                >
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              placeholder={t('merchant.customerName')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={guestName}
              onChangeText={setGuestName}
            />
            <TextInput
              placeholder={`${t('merchant.customerPhone')} (${t('common.optional')})`}
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
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <PrimaryButton title={t('merchant.createReservation')} loading={submitting} onPress={submitReservation} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.l,
    gap: SPACING.s,
  },
  content: {
    padding: SPACING.l,
    gap: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    gap: SPACING.m,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  selectionCard: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    gap: 4,
  },
  selectionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  selectionTitle: {
    color: COLORS.text,
    fontWeight: '700',
  },
  selectionTitleActive: {
    color: COLORS.primaryDark,
  },
  selectionSubtitle: {
    color: COLORS.textSecondary,
  },
  chipRow: {
    paddingRight: SPACING.s,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  chip: {
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: SPACING.s,
    marginBottom: SPACING.s,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.primaryDark,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: '800',
  },
  countText: {
    minWidth: 28,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
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
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
