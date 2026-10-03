import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, Lock, LogOut, Trash } from 'lucide-react-native';
import { AuthPromptCard } from '../components/AuthPromptCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LegalLinks } from '../components/LegalLinks';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReasonPromptModal } from '../components/ReasonPromptModal';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, bookingAPI, getErrorMessage } from '../services/api';
import { Language } from '../i18n/translations';
import { useFocusEffect } from '@react-navigation/native';

export function ProfileScreen({ navigation }: any) {
  const { user, isAuthenticated, logout, refreshUser, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const [freshUser, notificationsResponse, bookingsResponse] = await Promise.all([
        refreshUser().catch(() => user),
        authAPI.getNotifications(true),
        bookingAPI.list({ limit: 1 }),
      ]);

      if (freshUser) {
        await updateUser(freshUser);
      }
      setUnreadCount(notificationsResponse.unreadCount || 0);
      setBookingsCount(bookingsResponse.pagination?.total ?? bookingsResponse.bookings?.length ?? 0);
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshUser, t, updateUser, user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleLanguageChange = async (nextLanguage: Language) => {
    await setLanguage(nextLanguage);

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await authAPI.updateMe({ preferredLanguage: nextLanguage });
      await updateUser(response.user);
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.languageSaveFailed'));
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('profile.deleteFirstTitle'), t('profile.deleteFirstMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccount'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('profile.deleteSecondTitle'), t('profile.deleteSecondMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('profile.deleteAccount'),
              style: 'destructive',
              onPress: () => setDeleteVisible(true),
            },
          ]),
      },
    ]);
  };

  const submitDelete = async (password: string) => {
    if (!password) {
      Alert.alert(t('common.error'), t('auth.deletePasswordPrompt'));
      return;
    }

    setDeleteLoading(true);
    try {
      await authAPI.deleteMe({ password });
      setDeleteVisible(false);
      await logout();
      Alert.alert(t('common.ok'), t('profile.deleteSuccess'));
      navigation.navigate('MainTabs', { screen: 'Explore' });
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.guestContent} showsVerticalScrollIndicator={false}>
          <AuthPromptCard
            title={t('profile.guestTitle')}
            message={t('profile.guestMessage')}
            signInLabel={t('common.signIn')}
            createAccountLabel={t('common.createAccount')}
            onLogin={() => navigation.navigate('Login')}
            onRegister={() => navigation.navigate('Register')}
          />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
            <LanguageSwitcher language={language} onChange={(nextLanguage) => void handleLanguageChange(nextLanguage)} />
          </View>
          <View style={styles.section}>
            <LegalLinks
              privacyLabel={t('profile.privacy')}
              termsLabel={t('profile.terms')}
              supportLabel={t('profile.support')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'Y'}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {t(
                user?.role === 'MERCHANT'
                  ? 'profile.roleMerchant'
                  : user?.role === 'ADMIN'
                    ? 'profile.roleAdmin'
                    : 'profile.roleUser',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bookingsCount}</Text>
            <Text style={styles.statLabel}>{t('profile.bookingsCount')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>{t('profile.unreadNotifications')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <LanguageSwitcher language={language} onChange={(nextLanguage) => void handleLanguageChange(nextLanguage)} />
        </View>

        <View style={styles.menuCard}>
          <MenuRow
            icon={<Bell color={COLORS.primaryDark} size={20} />}
            label={t('profile.notifications')}
            trailing={String(unreadCount)}
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuRow
            icon={<Lock color={COLORS.primaryDark} size={20} />}
            label={t('profile.changePassword')}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        <View style={styles.section}>
          <LegalLinks
            privacyLabel={t('profile.privacy')}
            termsLabel={t('profile.terms')}
            supportLabel={t('profile.support')}
          />
        </View>

        <PrimaryButton
          title={t('profile.logout')}
          variant="secondary"
          icon={<LogOut color={COLORS.text} size={18} />}
          onPress={() => void logout()}
        />
        <PrimaryButton
          title={t('profile.deleteAccount')}
          variant="danger"
          icon={<Trash color={COLORS.white} size={18} />}
          onPress={confirmDelete}
        />
      </ScrollView>

      <ReasonPromptModal
        visible={deleteVisible}
        title={t('profile.deleteAccount')}
        description={t('auth.deletePasswordPrompt')}
        placeholder={t('auth.password')}
        confirmLabel={t('profile.deleteAccount')}
        loading={deleteLoading}
        secureTextEntry
        multiline={false}
        onCancel={() => setDeleteVisible(false)}
        onSubmit={(value) => void submitDelete(value)}
      />
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  trailing,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        {icon}
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {trailing && trailing !== '0' ? <Text style={styles.menuTrailing}>{trailing}</Text> : null}
        <ChevronRight color={COLORS.textSecondary} size={18} />
      </View>
    </TouchableOpacity>
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
  guestContent: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  scrollContent: {
    padding: SPACING.l,
    gap: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.s,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
  },
  name: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
  },
  email: {
    color: COLORS.textSecondary,
  },
  roleBadge: {
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleBadgeText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: COLORS.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontWeight: '600',
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
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  menuTrailing: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
});
