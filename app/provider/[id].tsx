import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getToken } from "../../utils/tokenStorage";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/theme";
import BackButton from "../../components/BackButton";
import ReportModal from "../../components/ReportModal";
import { Alert } from "../../utils/alert";
import { apiRequest } from "../../utils/api";
import { API_BASE_URL } from "../../config/api";

interface Gig {
  id: number;
  title: string;
  description: string;
  category: string;
  price: string;
  image: string | null;
}

interface PortfolioImage {
  id: number;
  image: string;
  caption: string;
}

interface ProviderDetail {
  id: number;
  username: string;
  bio: string;
  location: string;
  city: string;
  state: string;
  profile_picture: string | null;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  is_blocked: boolean;
  is_me: boolean;
  gigs: Gig[];
  portfolio: PortfolioImage[];
}

interface Review {
  id: number;
  booking: number;
  reviewer: number;
  reviewee: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_username: string;
}

function decodeUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(decoded);
    return parsed.user_id ?? null;
  } catch (err) {
    console.log("Failed to decode token:", err);
    return null;
  }
}

export default function ProviderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const fetchProvider = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      setCurrentUserId(decodeUserIdFromToken(token));

      const res = await fetch(`${API_BASE_URL}/app/provider/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load provider profile.");
      }

      const data = await res.json();
      setProvider(data);

      const reviewsRes = await fetch(`${API_BASE_URL}/app/provider/${id}/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }
    } catch (err) {
      setError("Could not load this profile. Pull down to retry, or go back.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload each time the profile comes into view, so a review that was just
  // written or deleted shows in the rating straight away.
  useFocusEffect(
    useCallback(() => {
      fetchProvider();
    }, [fetchProvider])
  );

  const toggleBlock = async () => {
    if (!provider) return;
    setBlocking(true);
    const result = provider.is_blocked
      ? await apiRequest(`/app/blocks/${provider.id}/`, { method: "DELETE" })
      : await apiRequest("/app/blocks/", { method: "POST", body: { blocked: provider.id } });
    setBlocking(false);
    if (!result.ok) {
      Alert.alert("Error", result.error);
      return;
    }
    setProvider({ ...provider, is_blocked: !provider.is_blocked });
  };

  const confirmToggleBlock = () => {
    if (!provider) return;
    if (provider.is_blocked) {
      toggleBlock();
      return;
    }
    Alert.alert(
      `Block ${provider.username}?`,
      "They won't be able to book or message you, and you won't see their services. You can undo this in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: toggleBlock },
      ]
    );
  };

  const handleDeleteReview = (reviewId: number) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const res = await fetch(`${API_BASE_URL}/app/reviews/${reviewId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                throw new Error("Delete failed");
              }

              setReviews((prev) => prev.filter((r) => r.id !== reviewId));
            } catch (err) {
              console.log("Delete review failed:", err);
              Alert.alert("Error", "Could not delete review.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={styles.safe}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || "Profile not found."}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={[styles.header, styles.headerSpread]}>
        <BackButton />
        {!provider.is_me && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Report ${provider.username}`}
              onPress={() => setReportVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.headerAction}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${provider.is_blocked ? "Unblock" : "Block"} ${provider.username}`}
              onPress={confirmToggleBlock}
              disabled={blocking}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={[styles.headerAction, styles.headerActionDanger]}>
                {provider.is_blocked ? "Unblock" : "Block"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ReportModal
        visible={reportVisible}
        userId={provider.id}
        userName={provider.username}
        onClose={() => setReportVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {provider.is_blocked && (
          <Text style={styles.blockedNote} accessibilityRole="alert">
            You have blocked {provider.username}. They can&apos;t book or message you.
          </Text>
        )}
        <View style={styles.profileSection}>
          {provider.profile_picture ? (
            <Image
              source={{ uri: provider.profile_picture }}
              style={styles.avatar}
              accessible
              accessibilityLabel={`Profile photo of ${provider.username}`}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {provider.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <Text style={styles.username}>{provider.username}</Text>
            {provider.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.location}>
            {provider.city}
            {provider.city && provider.state ? ", " : ""}
            {provider.state}
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.rating}>
              ★ {provider.average_rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({provider.total_reviews} review{provider.total_reviews === 1 ? "" : "s"})
            </Text>
          </View>

          {provider.bio ? <Text style={styles.bio}>{provider.bio}</Text> : null}
        </View>

        {provider.portfolio.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {provider.portfolio.map((item, index) => (
                <Image
                  key={item.id}
                  accessible
                  accessibilityLabel={`Portfolio photo ${index + 1} by ${provider.username}`}
                  source={{ uri: item.image }}
                  style={styles.portfolioImage}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {provider.gigs.length > 0 && !provider.is_blocked && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {provider.gigs.map((gig) => (
              <TouchableOpacity accessibilityRole="button"
                key={gig.id}
                style={styles.gigCard}
                onPress={() =>
                  provider.is_me
                    ? router.push(`/gig/${gig.id}?mine=true`)
                    : router.push({
                        pathname: "/booking/[gigId]",
                        params: {
                          gigId: String(gig.id),
                          gigTitle: gig.title,
                        },
                      })
                }
              >
                <Text style={styles.gigTitle}>{gig.title}</Text>
                <Text style={styles.gigDescription} numberOfLines={2}>
                  {gig.description}
                </Text>
                <Text style={styles.gigPrice}>Price negotiable</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewer_username}</Text>
                  <Text style={styles.reviewRating}>★ {review.rating}</Text>
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}

                {review.reviewer === currentUserId && (
                  <TouchableOpacity accessibilityRole="button"
                    accessibilityLabel="Delete my review"
                    onPress={() => handleDeleteReview(review.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSpread: { justifyContent: "space-between" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 20 },
  headerAction: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  headerActionDanger: { color: colors.danger },
  blockedNote: {
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  errorText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  profileSection: { alignItems: "center", marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: colors.primary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 20, fontWeight: "700", color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: colors.onPrimary },
  location: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  rating: { fontSize: 15, fontWeight: "700", color: colors.primary },
  reviewCount: { fontSize: 13, color: colors.textMuted },
  bio: { fontSize: 14, color: colors.textSecondary, marginTop: 14, textAlign: "center", lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  portfolioImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginRight: 10,
  },
  gigCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  gigTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  gigDescription: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  gigPrice: { fontSize: 13, fontWeight: "500", color: colors.textMuted, marginTop: 6, fontStyle: "italic" },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: { fontSize: 14, fontWeight: "700", color: colors.text },
  reviewRating: { fontSize: 14, fontWeight: "700", color: colors.primary },
  reviewComment: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
  deleteButton: { marginTop: 10, alignSelf: "flex-start" },
  deleteText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
});