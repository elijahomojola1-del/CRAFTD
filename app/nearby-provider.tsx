import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
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
import { API_BASE_URL } from "../config/api";

interface NearbyProvider {
  id: number;
  username: string;
  bio: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
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
    console.log(">>> fetchNearby STARTED");
    try {
      setError(null);
      const token = await SecureStore.getItemAsync("accessToken");
      console.log(">>> token retrieved:", token ? "yes (length " + token.length + ")" : "NULL/undefined");

      console.log(">>> fetching profile from:", `${API_BASE_URL}/app/profile/`);
      const profileRes = await fetch(`${API_BASE_URL}/app/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(">>> profile response status:", profileRes.status);

      if (!profileRes.ok) {
        throw new Error("Failed to load your profile.");
      }

      const profileData = await profileRes.json();
      console.log(">>> profile data:", JSON.stringify(profileData));
      const { latitude, longitude } = profileData;

      if (!latitude || !longitude) {
        console.log(">>> MISSING lat/lng, stopping here");
        setError("Your location isn't set yet. Enable location in your profile first.");
        setProviders([]);
        return;
      }

      const nearbyUrl = `${API_BASE_URL}/app/providers/nearby/?lat=${latitude}&lng=${longitude}&radius=30`;
      console.log(">>> fetching nearby from:", nearbyUrl);

      const nearbyRes = await fetch(nearbyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(">>> nearby response status:", nearbyRes.status);

      if (!nearbyRes.ok) {
        const errText = await nearbyRes.text();
        console.log(">>> nearby error body:", errText);
        throw new Error("Failed to fetch nearby providers.");
      }

      const data = await nearbyRes.json();
      console.log(">>> nearby data count:", data.length);
      setProviders(data);
    } catch (err) {
      console.log(">>> Nearby providers fetch failed:", err);
      setError("Could not load nearby providers. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log(">>> fetchNearby FINISHED");
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
    <TouchableOpacity
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Tradespeople</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#F5A623" size="large" />
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
              tintColor="#F5A623"
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
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  emptyText: { color: "#999", fontSize: 14, textAlign: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 16, fontWeight: "700", color: "#FAF7F2" },
  verifiedBadge: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: "#1C1C1E" },
  bio: { fontSize: 14, color: "#ccc", marginTop: 6 },
  location: { fontSize: 13, color: "#999", marginTop: 8 },
  distance: { fontSize: 13, color: "#F5A623", fontWeight: "700", marginTop: 4 },
});