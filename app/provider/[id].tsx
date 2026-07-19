import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  const fetchProvider = useCallback(async () => {
    try {
      setError(null);
      const token = await SecureStore.getItemAsync("accessToken");
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
      console.log("Fetching provider with id:", id, "URL:", `${API_BASE_URL}/app/provider/${id}/`);
      setError("Could not load this profile. Pull down to retry, or go back.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

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
              const token = await SecureStore.getItemAsync("accessToken");
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
          <ActivityIndicator color="#F5A623" size="large" />
        </View>
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{"< Back"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || "Profile not found."}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          {provider.profile_picture ? (
            <Image source={{ uri: provider.profile_picture }} style={styles.avatar} />
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
              {provider.portfolio.map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: item.image }}
                  style={styles.portfolioImage}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {provider.gigs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {provider.gigs.map((gig) => (
              <TouchableOpacity
                key={gig.id}
                style={styles.gigCard}
                onPress={() =>
                  router.push({
                    pathname: "/booking/[gigId]",
                    params: {
                      gigId: String(gig.id),
                      gigTitle: gig.title,
                      gigPrice: gig.price,
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
                  <TouchableOpacity
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
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  errorText: { color: "#999", fontSize: 14, textAlign: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  profileSection: { alignItems: "center", marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  avatarPlaceholder: {
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: "#F5A623" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 20, fontWeight: "700", color: "#FAF7F2" },
  verifiedBadge: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: "#1C1C1E" },
  location: { fontSize: 13, color: "#999", marginTop: 6 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  rating: { fontSize: 15, fontWeight: "700", color: "#F5A623" },
  reviewCount: { fontSize: 13, color: "#999" },
  bio: { fontSize: 14, color: "#ccc", marginTop: 14, textAlign: "center", lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FAF7F2", marginBottom: 12 },
  portfolioImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginRight: 10,
  },
  gigCard: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  gigTitle: { fontSize: 15, fontWeight: "700", color: "#FAF7F2" },
  gigDescription: { fontSize: 13, color: "#999", marginTop: 4 },
  gigPrice: { fontSize: 13, fontWeight: "500", color: "#999", marginTop: 6, fontStyle: "italic" },
  reviewCard: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: { fontSize: 14, fontWeight: "700", color: "#FAF7F2" },
  reviewRating: { fontSize: 14, fontWeight: "700", color: "#F5A623" },
  reviewComment: { fontSize: 13, color: "#ccc", marginTop: 6, lineHeight: 18 },
  deleteButton: { marginTop: 10, alignSelf: "flex-start" },
  deleteText: { color: "#F5A623", fontSize: 13, fontWeight: "600" },
});