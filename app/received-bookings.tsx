import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReviewModal from '../components/ReviewModal';
import { API_BASE_URL } from '../config/api';

interface Booking {
  id: number;
  gig: {
    id: number;
    title: string;
  };
  client: number;
  client_username: string;
  client_phone?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message: string;
  proposed_date: string;
  created_at: string;
  review_id: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623',
  accepted: '#2ECC71',
  declined: '#E74C3C',
  completed: '#3498DB',
  cancelled: '#7F8C8D',
};

export default function ReceivedBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [messagingId, setMessagingId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

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
    newStatus: 'accepted' | 'declined' | 'completed'
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

  const confirmMarkComplete = (bookingId: number) => {
    Alert.alert(
      'Mark this job as complete?',
      'The client will be able to leave a review once this is marked complete.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: () => handleStatusUpdate(bookingId, 'completed'),
        },
      ]
    );
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No phone number', 'This client has not added a phone number yet.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert('No phone number', 'This client has not added a phone number yet.');
      return;
    }
    const cleaned = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() => {
      Alert.alert('WhatsApp not available', 'Could not open WhatsApp on this device.');
    });
  };

  const handleMessage = async (booking: Booking) => {
    try {
      setMessagingId(booking.id);
      const token = await SecureStore.getItemAsync('accessToken');

      const response = await fetch(`${API_BASE_URL}/app/conversations/start/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: booking.id }),
      });

      if (!response.ok) {
        Alert.alert(
          "Can't message yet",
          'Messaging is only available once this booking is accepted.'
        );
        return;
      }

      const conversation = await response.json();

      router.push({
        pathname: '/conversation/[id]',
        params: {
          id: String(conversation.id),
          otherUsername: booking.client_username,
        },
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Something went wrong. Check your connection.');
    } finally {
      setMessagingId(null);
    }
  };

  const confirmDeleteReview = (reviewId: number) => {
    Alert.alert(
      'Delete this review?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteReview(reviewId),
        },
      ]
    );
  };

  const handleDeleteReview = async (reviewId: number) => {
    setDeletingReviewId(reviewId);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(`${API_BASE_URL}/app/reviews/${reviewId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.review_id === reviewId ? { ...b, review_id: null } : b
        )
      );
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'Could not delete review. Please try again.');
    } finally {
      setDeletingReviewId(null);
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

      <Text style={styles.clientName}>From: {item.client_username}</Text>

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
              <ActivityIndicator color="#1C1C1E" size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(item.client_phone)}
            >
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={() => handleWhatsApp(item.client_phone)}
            >
              <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => handleMessage(item)}
              disabled={messagingId === item.id}
            >
              {messagingId === item.id ? (
                <ActivityIndicator color="#1C1C1E" size="small" />
              ) : (
                <Text style={styles.messageButtonText}>💬 Message</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => confirmMarkComplete(item.id)}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? (
                <ActivityIndicator color="#FAF7F2" size="small" />
              ) : (
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {item.status === 'completed' && (
        <View style={styles.actionRow}>
          {item.review_id ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteReviewButton]}
              onPress={() => confirmDeleteReview(item.review_id!)}
              disabled={deletingReviewId === item.review_id}
            >
              {deletingReviewId === item.review_id ? (
                <ActivityIndicator color="#E74C3C" size="small" />
              ) : (
                <Text style={styles.deleteReviewButtonText}>Delete Review</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => setReviewTarget(item)}
            >
              <Text style={styles.reviewButtonText}>Review Client</Text>
            </TouchableOpacity>
          )}
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

      {reviewTarget && (
        <ReviewModal
          visible={!!reviewTarget}
          bookingId={reviewTarget.id}
          revieweeName={reviewTarget.client_username}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            fetchBookings();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
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
    color: '#FAF7F2',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
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
    color: '#FAF7F2',
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 13,
    color: '#999',
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
    color: '#1C1C1E',
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  declineButtonText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#3498DB',
  },
  completeButtonText: {
    color: '#FAF7F2',
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#F5A623',
  },
  reviewButtonText: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  deleteReviewButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  deleteReviewButtonText: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  callButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  callButtonText: {
    color: '#F5A623',
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappButtonText: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  messageButton: {
    backgroundColor: '#F5A623',
  },
  messageButtonText: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});