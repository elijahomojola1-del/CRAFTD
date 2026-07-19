import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config/api';

interface Gig {
  id: number;
  title: string;
  category: string;
  price: string;
  description: string;
  location: string;
  image: string | null;
}

export default function GigDetailScreen() {
  const { id, mine } = useLocalSearchParams<{ id: string; mine?: string }>();
  const router = useRouter();
  const isOwnGig = mine === "true";

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/app/gigs/${id}/`);
        if (!response.ok) throw new Error('Failed to fetch gig');
        const data = await response.json();
        setGig(data);
      } catch (err) {
        console.log('Error fetching gig:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGig();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
      </SafeAreaView>
    );
  }

  if (!gig) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Gig not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, isOwnGig && styles.contentNoButton]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>{'< Back'}</Text>
          </TouchableOpacity>
        </View>

        {gig.image ? (
          <Image source={{ uri: gig.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <Text style={styles.title}>{gig.title}</Text>
        <Text style={styles.category}>{gig.category}</Text>
        <Text style={styles.price}>Price negotiable</Text>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{gig.description}</Text>

        <Text style={styles.sectionLabel}>Location</Text>
        <Text style={styles.location}>{gig.location}</Text>
      </ScrollView>

      {!isOwnGig && (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            router.push({
              pathname: '/booking/[gigId]',
              params: {
                gigId: gig.id.toString(),
                gigTitle: gig.title,
                gigPrice: gig.price.toString(),
              },
            })
          }
        >
          <Text style={styles.bookButtonText}>Book This Gig</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  errorText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  contentNoButton: {
    paddingBottom: 30,
  },
  header: {
    marginBottom: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
    marginTop: 12,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  location: {
    fontSize: 15,
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#F5A623',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
});