import { getToken } from "../utils/tokenStorage";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import { Alert } from "../utils/alert";
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
      const token = await getToken();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">Review {revieweeName}</Text>
          <Text style={styles.sub}>
            How was your experience working with {revieweeName}?
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity accessibilityRole="button"
                key={star}
                accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
                accessibilityState={{ selected: star <= rating }}
                onPress={() => setRating(star)}
              >
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Add a comment (optional)"
            accessibilityLabel="Review comment, optional"
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity accessibilityRole="button"
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" onPress={resetAndClose} disabled={submitting}>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 18 },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  star: { fontSize: 36, color: colors.textMuted },
  starActive: { color: colors.primary },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    height: 90,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  submitButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
  cancelText: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
});