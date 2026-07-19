import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config/api';

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
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGigs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/app/gigs/`);
      if (!response.ok) throw new Error('Failed to fetch gigs');
      const data: Gig[] = await response.json();
      const filtered = category
        ? data.filter((g) => g.category === category)
        : data;
      setGigs(filtered);
    } catch (err) {
      console.log('Error fetching gigs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [category]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGigs();
  };

  const renderGig = ({ item }: { item: Gig }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/provider/${item.provider}`)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.thumbnail} />
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {category ? category.replace('_', ' ') : 'All Gigs'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F5A623" />
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
              tintColor="#F5A623"
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No gigs found in this category yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1C1C1E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { color: '#F5A623', fontSize: 15, fontWeight: '600', marginRight: 16 },
  title: { color: '#FAF7F2', fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#3A3A3C',
  },
  cardBody: { flex: 1, justifyContent: 'center' },
  gigTitle: { fontSize: 15, fontWeight: '700', color: '#FAF7F2', marginBottom: 2 },
  providerName: { fontSize: 13, color: '#999', marginBottom: 4 },
  rating: { fontSize: 12, color: '#F5A623', fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 13, fontWeight: '500', color: '#999', fontStyle: 'italic' },
});