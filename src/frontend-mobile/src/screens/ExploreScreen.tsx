import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExperienceCard } from '../components/ExperienceCard';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { experienceAPI, getErrorMessage } from '../services/api';
import { Experience } from '../types/api';
import { hasCategoryTag } from '../utils/experience';

const CATEGORIES = [
  { key: '', label: 'explore.all' },
  { key: 'adventure', label: 'explore.adventure' },
  { key: 'romantic', label: 'explore.romantic' },
  { key: 'cultural', label: 'explore.cultural' },
  { key: 'balloon', label: 'explore.balloon' },
] as const;

export function ExploreScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchExperiences = useCallback(
    async (nextPage: number, reset = false) => {
      if (reset) {
        setLoading(true);
      }

      try {
        if (debouncedQuery) {
          const response = await experienceAPI.search(debouncedQuery);
          const searchResults = (response.experiences || []).filter((item) => hasCategoryTag(item, category));
          setExperiences(searchResults);
          setHasMore(false);
          setPage(1);
          return;
        }

        const response = await experienceAPI.explore({
          page: nextPage,
          limit: 10,
          sort: 'rating',
          vibe: category || undefined,
          category: category || undefined,
        });
        const incoming = (response.experiences || []).filter((item) => hasCategoryTag(item, category));
        setExperiences((current) => (reset ? incoming : [...current, ...incoming]));
        setPage(nextPage);
        setHasMore(nextPage < (response.pagination?.pages || nextPage));
      } catch (error) {
        Alert.alert(t('common.error'), getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, debouncedQuery, t],
  );

  useEffect(() => {
    void fetchExperiences(1, true);
  }, [fetchExperiences]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchExperiences(1, true);
  };

  const onEndReached = () => {
    if (!debouncedQuery && !loading && hasMore) {
      void fetchExperiences(page + 1);
    }
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.title')}</Text>
        <Text style={styles.subtitle}>{t('explore.subtitle')}</Text>
        <TextInput
          placeholder={t('explore.search')}
          placeholderTextColor={COLORS.textSecondary}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          horizontal
          data={CATEGORIES as unknown as Array<{ key: string; label: string }>}
          keyExtractor={(item) => item.key || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = item.key === category;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(item.key)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{t(item.label)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    ),
    [category, searchQuery, t],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading && experiences.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={experiences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExperienceCard
              experience={item}
              language={language}
              onPress={() => navigation.navigate('Detail', { experienceId: item.id, experience: item })}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('explore.noResults')}</Text>
            </View>
          }
          ListFooterComponent={
            loading && experiences.length > 0 ? <ActivityIndicator color={COLORS.primary} style={styles.footerLoader} /> : null
          }
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.s,
  },
  searchInput: {
    borderRadius: BORDER_RADIUS.button,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: COLORS.text,
  },
  categoryList: {
    paddingVertical: SPACING.s,
  },
  categoryChip: {
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: SPACING.s,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  footerLoader: {
    marginTop: SPACING.m,
  },
});
