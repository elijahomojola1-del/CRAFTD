import { useFocusEffect, useRouter } from "expo-router";
import { getToken } from "../utils/tokenStorage";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import { colors } from "../constants/theme";
import { Alert } from "../utils/alert";
import ReviewModal from "../components/ReviewModal";
import { API_BASE_URL } from "../config/api";

const STATUS_COLORS: Record<string, string> = {
  pending: colors.primary,
  accepted: colors.success,
  declined: colors.danger,
  completed: colors.info,
  cancelled: colors.textMuted,
};

const GOLD = colors.primary;

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [messagingId, setMessagingId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/app/bookings/mine/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.log("Failed to fetch my bookings:", response.status);
        setLoadError(true);
        return;
      }

      const data = await response.json();
      setBookings(data);
      setLoadError(false);
    } catch (err) {
      console.log("Error fetching my bookings:", err);
      setLoadError(true);
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
      const token = await getToken();

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
      const token = await getToken();

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
      const token = await getToken();
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
      const token = await getToken();

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
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">My Bookings</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle} accessibilityRole="alert">Couldn&apos;t load your bookings</Text>
          <Text style={styles.emptySub}>Check your connection and try again</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.actionButton, styles.reviewButton, { marginTop: 20, paddingHorizontal: 24 }]}
            onPress={fetchMyBookings}
          >
            <Text style={styles.reviewButtonText}>Try Again</Text>
          </TouchableOpacity>
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
                <Image
                  source={{ uri: item.gig_image }}
                  style={styles.cardImage}
                  accessible
                  accessibilityLabel={`Photo for ${item.gig_title || "gig"}`}
                />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.gig_title || "Gig"}</Text>
                <Text style={styles.cardProvider}>
                  to {item.provider_username}
                </Text>
                <Text style={styles.cardDate}>
                  {item.proposed_date
                    ? new Date(item.proposed_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No date set"}
                </Text>
                {item.message ? (
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] || colors.textMuted },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>

                {item.status === "accepted" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity accessibilityRole="button"
                      style={[styles.actionButton, styles.callButton]}
                      onPress={() => handleCall(item.provider_phone)}
                    >
                      <Text style={styles.callButtonText}>📞 Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity accessibilityRole="button"
                      style={[styles.actionButton, styles.whatsappButton]}
                      onPress={() => handleWhatsApp(item.provider_phone)}
                    >
                      <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === "accepted" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity accessibilityRole="button"
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={() => handleMessage(item)}
                      disabled={messagingId === item.id}
                    >
                      {messagingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      ) : (
                        <Text style={styles.messageButtonText}>💬 Message</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  {(item.status === "pending" || item.status === "accepted") && (
                    <TouchableOpacity accessibilityRole="button"
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => confirmCancel(item.id)}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {item.status === "completed" && (
                    item.review_id ? (
                      <TouchableOpacity accessibilityRole="button"
                        style={[styles.actionButton, styles.deleteReviewButton]}
                        onPress={() => confirmDeleteReview(item.review_id)}
                        disabled={deletingReviewId === item.review_id}
                      >
                        {deletingReviewId === item.review_id ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Text style={styles.deleteReviewButtonText}>
                            Delete Review
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity accessibilityRole="button"
                        style={[styles.actionButton, styles.reviewButton]}
                        onPress={() => setReviewTarget(item)}
                      >
                        <Text style={styles.reviewButtonText}>
                          Review Provider
                        </Text>
                      </TouchableOpacity>
                    )
                  )}

                  <TouchableOpacity accessibilityRole="button"
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(item.id)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.textMuted} />
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
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { color: GOLD, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.text, marginBottom: 6 },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  cardImage: { width: 90, height: 90 },
  cardImagePlaceholder: { backgroundColor: colors.border },
  cardInfo: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  cardProvider: { color: GOLD, fontSize: 14, fontWeight: "600" },
  cardDate: { color: colors.textMuted, fontSize: 13, marginTop: 2, fontWeight: "600" },
  cardMessage: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700", color: colors.onPrimary },
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
    borderColor: colors.danger,
  },
  cancelButtonText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  reviewButton: {
    backgroundColor: GOLD,
  },
  reviewButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13 },
  deleteReviewButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteReviewButtonText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  deleteButtonText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
  callButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: GOLD,
  },
  callButtonText: { color: GOLD, fontWeight: "700", fontSize: 13 },
  whatsappButton: {
    backgroundColor: colors.whatsapp,
  },
  whatsappButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13 },
  messageButton: {
    backgroundColor: GOLD,
  },
  messageButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13 },
});