import React, { useCallback, useState } from 'react';
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
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, getErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/datetime';
import { useFocusEffect } from '@react-navigation/native';

export function NotificationsScreen() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await authAPI.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void fetchNotifications();
    }, [fetchNotifications]),
  );

  const handlePress = async (item: any) => {
    if (item.isRead) {
      return;
    }

    try {
      await authAPI.markNotificationRead(item.id);
      setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchNotifications(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.isRead && styles.cardRead]} onPress={() => void handlePress(item)}>
            <Text style={styles.message}>{item.title || item.message}</Text>
            {item.title && item.message !== item.title ? <Text style={styles.body}>{item.message}</Text> : null}
            <Text style={styles.date}>{formatDateTime(item.createdAt, language)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  cardRead: {
    opacity: 0.72,
  },
  message: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  body: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
