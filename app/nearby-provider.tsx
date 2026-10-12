import { useRouter } from "expo-router";
import { getToken } from "../utils/tokenStorage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import BackButton from "../components/BackButton";
import { API_BASE_URL } from "../config/api";

interface NearbyProvider {
  id: number;
  username: string;
  bio: string;
  city: string;
  state: string;
  is_verified: boolean;
  distance_km: number;
}

export default function NearbyProvidersScreen() {
  const router = useRouter();
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();

      const profileRes = await fetch(`${API_BASE_URL}/app/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        throw new Error("Failed to load your profile.");
      }

      const profileData = await profileRes.json();
      const { latitude, longitude } = profileData;

      if (!latitude || !longitude) {
        setError("Your location isn't set yet. Enable location in your profile first.");
        setProviders([]);
        return;
      }

      const nearbyUrl = `${API_BASE_URL}/app/providers/nearby/?lat=${latitude}&lng=${longitude}&radius=30`;

      const nearbyRes = await fetch(nearbyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!nearbyRes.ok) {
        const errText = await nearbyRes.text();
        throw new Error("Failed to fetch nearby providers.");
      }

      const data = await nearbyRes.json();
      setProviders(data);
    } catch (err) {
      setError("Could not load nearby providers. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearby();
  };

  const renderItem = ({ item }: { item: NearbyProvider }) => (
    <TouchableOpacity accessibilityRole="button"
      style={styles.card}
      onPress={() => router.push({ pathname: "/provider/[id]", params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.username}>{item.username}</Text>
        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
      <Text style={styles.location}>{item.city}, {item.state}</Text>
      <Text style={styles.distance}>{item.distance_km.toFixed(1)} km away</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Nearby Tradespeople</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {error || "No providers found nearby."}
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 16, fontWeight: "700", color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: colors.onPrimary },
  bio: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  location: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  distance: { fontSize: 13, color: colors.primary, fontWeight: "700", marginTop: 4 },
});