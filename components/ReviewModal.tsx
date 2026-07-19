import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

interface ReviewModalProps {
  visible: boolean;
  bookingId: number;
  revieweeName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ReviewModal({
  visible,
  bookingId,
  revieweeName,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Add a rating", "Please select at least one star.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await fetch(
        `${API_BASE_URL}/app/bookings/${bookingId}/reviews/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const detail =
          errData?.detail ||
          (Array.isArray(errData) ? errData[0] : null) ||
          "Could not submit review.";
        Alert.alert("Review failed", String(detail));
        return;
      }

      Alert.alert("Thanks!", "Your review has been submitted.");
      setRating(0);
      setComment("");
      onSubmitted?.();
      onClose();
    } catch (err) {
      console.log("Review submit error:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Review {revieweeName}</Text>
          <Text style={styles.sub}>
            How was your experience working with {revieweeName}?
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={resetAndClose} disabled={submitting}>
            <Text style={styles.cancelText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2", marginBottom: 6 },
  sub: { fontSize: 13, color: "#999", marginBottom: 20, lineHeight: 18 },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  star: { fontSize: 36, color: "#555" },
  starActive: { color: "#F5A623" },
  input: {
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    padding: 14,
    color: "#FAF7F2",
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    height: 90,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#F5A623",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  submitButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 15 },
  cancelText: { color: "#999", fontSize: 13, textAlign: "center" },
});