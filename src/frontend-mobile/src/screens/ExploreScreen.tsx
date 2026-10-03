import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { ExperienceCard } from '../components/ExperienceCard';
import { useLanguage } from '../context/LanguageContext';
import { experienceAPI } from '../services/api';

const CATEGORIES = [
  { key: '', label: 'all' },
  { key: 'adventure', label: 'adventure' },
  { key: 'romantic', label: 'romantic' },
  { key: 'cultural', label: 'cultural' },
  { key: 'balloon', label: 'balloon' },
];

export const ExploreScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExperiences = async (pageNum = 1, category = '', reset = false) => {
    if (reset) {
      setLoading(true);
    }
    try {
      const params: any = { page: pageNum, limit: 10, sort: 'rating' };
      if (category) params.vibe = category;

      let res;
      if (searchQuery) {
        res = await experienceAPI.search(searchQuery);
        setExperiences(res.experiences || []);
        setHasMore(false);
      } else {
        res = await experienceAPI.explore(params);
        const newExps = res.experiences || [];
        setExperiences(prev => reset ? newExps : [...prev, ...newExps]);
        setHasMore(newExps.length === 10);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('[Explore] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExperiences(1, activeCategory, true);
  }, [activeCategory, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExperiences(1, activeCategory, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchExperiences(page + 1, activeCategory);
    }
  };

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    setSearchQuery('');
  };

  const renderFooter = () => {
    if (!loading || experiences.length === 0) return null;
    return <ActivityIndicator style={{ padding: 20 }} color={COLORS.primary} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.title')}</Text>
        <Text style={styles.subtitle}>{t('explore.subtitle')}</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.search')}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item.key && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(item.key)}
            >
              <Text style={[styles.categoryText, activeCategory === item.key && styles.categoryTextActive]}>
                {t(`explore.${item.label}`)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {loading && experiences.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={experiences}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <ExperienceCard
              experience={{
                id: item.id,
                title: item.titleCn || item.title,
                price: Number(item.priceCny),
                rating: item.rating,
                thumbnail: item.images?.[0] || '',
                aiBadge: item.aiBadge,
              }}
              onPress={() => navigation.navigate('Details', { experienceId: item.id })}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('explore.noResults')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.l, marginTop: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 },
  searchContainer: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 12, fontSize: 16,
    color: COLORS.text, backgroundColor: COLORS.white,
  },
  categoryList: { paddingRight: SPACING.l },
  categoryChip: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: COLORS.white },
  listContent: { paddingBottom: SPACING.xl, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});