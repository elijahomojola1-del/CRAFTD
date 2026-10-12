import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/theme';
import BackButton from '../components/BackButton';
import { apiRequest } from '../utils/api';

interface Gig {
  id: number;
  provider: number;
  provider_username: string;
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
  image: string | null;
  is_active: boolean;
  provider_rating: number | null;
  provider_review_count: number;
}

export default function GigsListScreen() {
  const { category, search: initialSearch } = useLocalSearchParams<{ category?: string; search?: string }>();
  const router = useRouter();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // `query` is what's typed; `search` is what was last submitted.
  const [query, setQuery] = useState(initialSearch ?? '');
  const [search, setSearch] = useState(initialSearch ?? '');

  const fetchGigs = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    const suffix = params.toString() ? `?${params.toString()}` : '';

    const result = await apiRequest<Gig[]>(`/app/gigs/${suffix}`, {
      fallbackError: 'Could not load gigs. Pull down to try again.',
    });
    setError(result.ok ? '' : result.error);
    if (result.ok && result.data) setGigs(result.data);
    setLoading(false);
    setRefreshing(false);
  }, [category, search]);

  useEffect(() => {
    setLoading(true);
    fetchGigs();
  }, [fetchGigs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGigs();
  };

  const renderGig = ({ item }: { item: Gig }) => (
    <TouchableOpacity accessibilityRole="button"
      style={styles.card}
      onPress={() => router.push(`/provider/${item.provider}`)}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.thumbnail}
          accessible
          accessibilityLabel={`Photo for ${item.title}`}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
      )}

      <View style={styles.cardBody}>
        <Text style={styles.gigTitle}>{item.title}</Text>
        <Text style={styles.providerName}>{item.provider_username}</Text>

        {item.provider_rating !== null && (
          <Text style={styles.rating}>
            ★ {item.provider_rating.toFixed(1)} ({item.provider_review_count})
          </Text>
        )}

        <Text style={styles.price}>Price negotiable</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">
          {category ? category.replace('_', ' ') : 'All Gigs'}
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={category ? 'Search this category' : 'Search services or places'}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search gigs"
          returnKeyType="search"
          autoCapitalize="none"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text === '') setSearch('');
          }}
          onSubmitEditing={() => setSearch(query)}
        />
        <TouchableOpacity accessibilityRole="button" style={styles.searchButton} onPress={() => setSearch(query)}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGig}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText} accessibilityRole={error ? 'alert' : undefined}>
                {error ||
                  (search.trim()
                    ? `Nothing found for "${search.trim()}". Try a different word.`
                    : 'No gigs found in this category yet.')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 14,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.border,
  },
  cardBody: { flex: 1, justifyContent: 'center' },
  gigTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  providerName: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  rating: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 13, fontWeight: '500', color: colors.textMuted, fontStyle: 'italic' },
});