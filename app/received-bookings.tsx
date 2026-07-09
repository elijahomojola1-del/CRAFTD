import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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
import { API_BASE_URL } from '../config/api';

interface Booking {
  id: number;
  gig: {
    id: number;
    title: string;
  };
  client: {
    id: number;
    username: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message: string;
  proposed_date: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623',
  accepted: '#2ECC71',
  declined: '#E74C3C',
  completed: '#3498DB',
  cancelled: '#7F8C8D',
};

export default function ReceivedBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(`${API_BASE_URL}/app/bookings/received/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch received bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching received bookings:', error);
      Alert.alert('Error', 'Could not load job requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleStatusUpdate = async (
    bookingId: number,
    newStatus: 'accepted' | 'declined'
  ) => {
    setUpdatingId(bookingId);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/app/bookings/${bookingId}/status/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Could not update this request. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.gigTitle}>{item.gig.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.clientName}>From: {item.client.username}</Text>

      {item.message ? (
        <Text style={styles.message}>{item.message}</Text>
      ) : null}

      <Text style={styles.date}>
        Proposed:{' '}
        {new Date(item.proposed_date).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </Text>

      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleStatusUpdate(item.id, 'declined')}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color="#E74C3C" size="small" />
            ) : (
              <Text style={styles.declineButtonText}>Decline</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleStatusUpdate(item.id, 'accepted')}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color="#FAF7F2" size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Job Requests</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F5A623"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No job requests yet.</Text>
          </View>
        }
      />
    </View>
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
    paddingTop: 80,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#F5A623',
  },
  acceptButtonText: {
    color: '#FAF7F2',
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  declineButtonText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
  },
});