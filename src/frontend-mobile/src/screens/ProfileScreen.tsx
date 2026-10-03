import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Booking, Globe, Star, Bell, CreditCard, LogOut, ChevronRight, Settings as SettingsIcon } from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (user?.id === 'guest') {
        setProfile({ fullName: 'Guest', membershipLevel: 'GUEST', preferredLanguage: language, _count: { bookings: 0, reviews: 0 } });
      } else {
        const res = await authAPI.getProfile();
        setProfile(res.user);
      }
    } catch (error) {
      console.error('[Profile] Error:', error);
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleLanguageChange = (lang: 'CN' | 'EN' | 'TR') => {
    setLanguage(lang);
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

  const fullName = profile?.fullName || 'User';
  const level = profile?.membershipLevel || 'GUEST';
  const levelKey = `profile.${level.toLowerCase()}`;
  const bookingCount = profile?._count?.bookings || 0;
  const reviewCount = profile?._count?.reviews || 0;
  const trustScore = profile?.trustScore || 0;

  const menuItems = [
    { icon: Booking, label: t('profile.myBookings'), onPress: () => navigation.navigate('MyTrips'), count: bookingCount },
    { icon: Star, label: t('profile.reviews'), onPress: () => {}, count: reviewCount },
    { icon: Bell, label: t('profile.notifications'), onPress: () => {}, count: null },
    { icon: CreditCard, label: t('profile.paymentMethods'), onPress: () => {}, count: null },
    { icon: SettingsIcon, label: t('profile.settings'), onPress: () => {}, count: null },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: level === 'VIP' ? COLORS.secondary : COLORS.primary }]}>
              <Text style={styles.levelText}>{t(levelKey)}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          {trustScore > 0 && (
            <Text style={styles.trustScore}>Trust Score: {trustScore.toFixed(1)} ★</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bookingCount}</Text>
            <Text style={styles.statLabel}>{t('profile.myBookings')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reviewCount}</Text>
            <Text style={styles.statLabel}>{t('profile.reviews')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{trustScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Trust</Text>
          </View>
        </View>

        {/* Language Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <View style={styles.langRow}>
            {(['CN', 'EN', 'TR'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langButton, language === lang && styles.langButtonActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                  {lang === 'CN' ? '中文' : lang === 'EN' ? 'English' : 'Türkçe'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <Icon size={22} color={COLORS.primary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.count !== null && item.count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{item.count}</Text>
                    </View>
                  )}
                  <ChevronRight size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#F44336" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Yuanly AI v1.0.0</Text>
          <Text style={styles.footerSubtext}>缘 — The fateful connection</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: SPACING.xl, marginTop: 10 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  levelBadge: { position: 'absolute', bottom: -4, right: -4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  levelText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  trustScore: { fontSize: 14, color: COLORS.secondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.l, marginBottom: SPACING.l },
  statCard: { flex: 1, backgroundColor: COLORS.white, padding: 16, borderRadius: 15, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  section: { padding: SPACING.l },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 8 },
  langButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  langButtonActive: { borderColor: COLORS.primary },
  langText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  langTextActive: { color: COLORS.primary },
  menuContainer: { paddingHorizontal: SPACING.l },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderRadius: 15, marginBottom: 8 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: COLORS.text, marginLeft: 14 },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  countBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  countText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: SPACING.l, padding: 16, borderRadius: 15, backgroundColor: '#FFF0F0', gap: 8 },
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', padding: SPACING.l, paddingBottom: 40 },
  footerText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  footerSubtext: { fontSize: 12, color: COLORS.textSecondary },
});