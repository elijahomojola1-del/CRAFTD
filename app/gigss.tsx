import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../config/api';

interface Gig {
  id: number;
  title: string;
  category: string;
  price: number;
  image?: string;
}

export default function GigsScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category ?? 'All');

  const fetchGigs = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      console.log('API_BASE_URL is:', API_BASE_URL);
      console.log('Token exists:', !!token);
      const response = await fetch(`${API_BASE_URL}/app/gigs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', response.status);
      const data = await response.json();

if (response.ok && Array.isArray(data)) {
  setGigs(data);
} else {
  console.log('Gigs fetch failed or bad shape:', data);
  setGigs([]);
}
    } catch (error) {
      console.log('Error fetching gigs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGigs();
  };

  
  const filteredGigs =
    selectedCategory === 'All' ? gigs : gigs.filter((g) => g.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#F5A623" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedCategory === 'All' ? 'All Gigs' : `${selectedCategory} Gigs`}</Text>
      </View>

      

      <FlatList
        data={filteredGigs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.emptyText}>No gigs available yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gigCard}
            onPress={() => {
              router.push(`/gig/${item.id}`);
            }}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.gigImage} resizeMode="cover" />
            ) : (
              <View style={[styles.gigImage, styles.gigImagePlaceholder]} />
            )}
            <View style={styles.gigTextContainer}>
              <Text style={styles.gigTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
              <Text style={styles.gigPrice}>${Number(item.price).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    color: '#F5A623',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    color: '#FAF7F2',
    fontSize: 24,
    fontWeight: '700',
  },
  categoryRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2C',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#F5A623',
  },
  chipText: {
    color: '#FAF7F2',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyText: {
    color: '#FAF7F2',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  gigCard: {
    backgroundColor: '#2A2A2C',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  gigImage: {
    width: '100%',
    height: 150,
  },
  gigImagePlaceholder: {
    backgroundColor: '#3A3A3C',
  },
  gigTextContainer: {
    padding: 12,
  },
  gigTitle: {
    color: '#FAF7F2',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5A62333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgeText: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '600',
  },
  gigPrice: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '700',
  },
});