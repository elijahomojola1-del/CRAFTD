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
import { colors } from '../../constants/theme';
import BackButton from '../../components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config/api';
import { Alert } from '../../utils/alert';
import { apiRequest } from '../../utils/api';

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
  const [deleting, setDeleting] = useState(false);

  const deleteGig = async () => {
    setDeleting(true);
    const result = await apiRequest(`/app/gigs/${id}/`, {
      method: 'DELETE',
      fallbackError: 'Could not delete this skill. Please try again.',
    });
    setDeleting(false);
    if (!result.ok) {
      Alert.alert('Error', result.error);
      return;
    }
    router.replace('/skills');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this skill?',
      'Clients will no longer be able to find or book it. Bookings already made for it are removed too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteGig },
      ]
    );
  };

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
        <ActivityIndicator size="large" color={colors.primary} />
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
          <BackButton color="#8A5A00" />
        </View>

        {gig.image ? (
          <Image
            source={{ uri: gig.image }}
            style={styles.image}
            resizeMode="contain"
            accessible
            accessibilityLabel={`Photo for ${gig.title}`}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <Text style={styles.title} accessibilityRole="header">{gig.title}</Text>
        <Text style={styles.category}>{gig.category}</Text>
        <Text style={styles.price}>Price negotiable</Text>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{gig.description}</Text>

        <Text style={styles.sectionLabel}>Location</Text>
        <Text style={styles.location}>{gig.location}</Text>
      </ScrollView>

      {!isOwnGig && (
        <TouchableOpacity accessibilityRole="button"
          style={styles.bookButton}
          onPress={() =>
            router.push({
              pathname: '/booking/[gigId]',
              params: {
                gigId: gig.id.toString(),
                gigTitle: gig.title,
              },
            })
          }
        >
          <Text style={styles.bookButtonText}>Book This Gig</Text>
        </TouchableOpacity>
      )}

      {isOwnGig && (
        <View style={styles.ownerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.ownerButton, styles.editButton]}
            onPress={() => router.push(`/add-skill?id=${gig.id}`)}
            disabled={deleting}
          >
            <Text style={styles.editButtonText}>Edit Skill</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.ownerButton, styles.deleteButton]}
            onPress={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#B3261E" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  ownerButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButton: { backgroundColor: colors.primary },
  editButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  deleteButton: { borderWidth: 1, borderColor: '#B3261E' },
  deleteButtonText: { fontSize: 15, fontWeight: '700', color: '#B3261E' },
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
    color: '#5F5F63',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5F5F63',
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
    backgroundColor: colors.primary,
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
    color: colors.onPrimary,
  },
});