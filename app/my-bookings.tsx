import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReviewModal from "../components/ReviewModal";
import { API_BASE_URL } from "../config/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F5A623",
  accepted: "#4CAF50",
  declined: "#E74C3C",
  completed: "#3498DB",
  cancelled: "#999",
};

const GOLD = "#F5A623";

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [messagingId, setMessagingId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(`${API_BASE_URL}/app/bookings/mine/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.log("Failed to fetch my bookings:", response.status);
        setBookings([]);
        return;
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.log("Error fetching my bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyBookings();
    }, [])
  );

  const cancelBooking = async (bookingId: number) => {
    try {
      setUpdatingId(bookingId);
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(
        `${API_BASE_URL}/app/bookings/${bookingId}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!response.ok) {
        Alert.alert("Error", "Could not cancel booking. Try again.");
        return;
      }

      await fetchMyBookings();
    } catch (err) {
      console.log("Error cancelling booking:", err);
      Alert.alert("Error", "Something went wrong. Check your connection.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      setUpdatingId(bookingId);
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(
        `${API_BASE_URL}/app/bookings/${bookingId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        Alert.alert("Error", "Could not remove booking. Try again.");
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.log("Error deleting booking:", err);
      Alert.alert("Error", "Something went wrong. Check your connection.");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmCancel = (bookingId: number) => {
    Alert.alert(
      "Cancel this booking?",
      "The provider will be notified that you cancelled the request.",
      [
        { text: "Back", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => cancelBooking(bookingId),
        },
      ]
    );
  };

  const confirmDelete = (bookingId: number) => {
    Alert.alert(
      "Remove this booking?",
      "This will remove it from your list. This can't be undone.",
      [
        { text: "Back", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBooking(bookingId),
        },
      ]
    );
  };

  const confirmDeleteReview = (reviewId: number) => {
    Alert.alert(
      "Delete this review?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteReview(reviewId),
        },
      ]
    );
  };

  const handleDeleteReview = async (reviewId: number) => {
    setDeletingReviewId(reviewId);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await fetch(`${API_BASE_URL}/app/reviews/${reviewId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.review_id === reviewId ? { ...b, review_id: null } : b
        )
      );
    } catch (err) {
      console.log("Error deleting review:", err);
      Alert.alert("Error", "Could not delete review. Please try again.");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert("No phone number", "This provider has not added a phone number yet.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert("No phone number", "This provider has not added a phone number yet.");
      return;
    }
    const cleaned = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() => {
      Alert.alert("WhatsApp not available", "Could not open WhatsApp on this device.");
    });
  };

  const handleMessage = async (booking: any) => {
    try {
      setMessagingId(booking.id);
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(`${API_BASE_URL}/app/conversations/start/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking_id: booking.id }),
      });

      if (!response.ok) {
        Alert.alert(
          "Can't message yet",
          "Messaging is only available once the provider has accepted this booking."
        );
        return;
      }

      const conversation = await response.json();

      router.push({
        pathname: "/conversation/[id]",
        params: {
          id: String(conversation.id),
          otherUsername: booking.provider_username,
        },
      });
    } catch (err) {
      console.log("Error starting conversation:", err);
      Alert.alert("Error", "Something went wrong. Check your connection.");
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Requests</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            Requests you send to providers will show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.gig_image ? (
                <Image source={{ uri: item.gig_image }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.gig_title || "Gig"}</Text>
                <Text style={styles.cardProvider}>
                  to {item.provider_username}
                </Text>
                <Text style={styles.cardDate}>
                  {item.proposed_date || "No date set"}
                </Text>
                {item.message ? (
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] || "#999" },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>

                {item.status === "accepted" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.callButton]}
                      onPress={() => handleCall(item.provider_phone)}
                    >
                      <Text style={styles.callButtonText}>📞 Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.whatsappButton]}
                      onPress={() => handleWhatsApp(item.provider_phone)}
                    >
                      <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === "accepted" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={() => handleMessage(item)}
                      disabled={messagingId === item.id}
                    >
                      {messagingId === item.id ? (
                        <ActivityIndicator size="small" color="#1C1C1E" />
                      ) : (
                        <Text style={styles.messageButtonText}>💬 Message</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  {(item.status === "pending" || item.status === "accepted") && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => confirmCancel(item.id)}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? (
                        <ActivityIndicator size="small" color="#E74C3C" />
                      ) : (
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {item.status === "completed" && (
                    item.review_id ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteReviewButton]}
                        onPress={() => confirmDeleteReview(item.review_id)}
                        disabled={deletingReviewId === item.review_id}
                      >
                        {deletingReviewId === item.review_id ? (
                          <ActivityIndicator size="small" color="#E74C3C" />
                        ) : (
                          <Text style={styles.deleteReviewButtonText}>
                            Delete Review
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reviewButton]}
                        onPress={() => setReviewTarget(item)}
                      >
                        <Text style={styles.reviewButtonText}>
                          Review Provider
                        </Text>
                      </TouchableOpacity>
                    )
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(item.id)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#999" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          visible={!!reviewTarget}
          bookingId={reviewTarget.id}
          revieweeName={reviewTarget.provider_username}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            fetchMyBookings();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { color: GOLD, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#FAF7F2", marginBottom: 6 },
  emptySub: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  cardImage: { width: 90, height: 90 },
  cardImagePlaceholder: { backgroundColor: "#3A3A3C" },
  cardInfo: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { color: "#FAF7F2", fontSize: 17, fontWeight: "600" },
  cardProvider: { color: GOLD, fontSize: 14, fontWeight: "600" },
  cardDate: { color: "#999", fontSize: 13, marginTop: 2, fontWeight: "600" },
  cardMessage: { color: "#999", fontSize: 13, marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700", color: "#1C1C1E" },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  cancelButtonText: { color: "#E74C3C", fontWeight: "700", fontSize: 13 },
  reviewButton: {
    backgroundColor: GOLD,
  },
  reviewButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 13 },
  deleteReviewButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  deleteReviewButtonText: { color: "#E74C3C", fontWeight: "700", fontSize: 13 },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#555",
  },
  deleteButtonText: { color: "#999", fontWeight: "700", fontSize: 13 },
  callButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: GOLD,
  },
  callButtonText: { color: GOLD, fontWeight: "700", fontSize: 13 },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  whatsappButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 13 },
  messageButton: {
    backgroundColor: GOLD,
  },
  messageButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 13 },
});