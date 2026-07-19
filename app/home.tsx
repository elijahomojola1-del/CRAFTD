import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [locationChecked, setLocationChecked] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  const [stats, setStats] = useState({ jobs_done: 0, reviews: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);  // ← added

  const saveLocationToProfile = async (data: {
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  }) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      await fetch(`${API_BASE_URL}/app/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.log("Failed to save location:", err);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setShowManualLocation(true);
        setLocationChecked(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      let city = "";
      let regionState = "";

      try {
        const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded.length > 0) {
          city = geocoded[0].city || geocoded[0].subregion || "";
          regionState = geocoded[0].region || "";
        }
      } catch (geoErr) {
        console.log("Reverse geocoding failed:", geoErr);
      }

      await saveLocationToProfile({ latitude, longitude, city, state: regionState });
      setLocationChecked(true);
    } catch (err) {
      console.log("Location request failed:", err);
      setShowManualLocation(true);
      setLocationChecked(true);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/app/provider-stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setStats({ jobs_done: data.jobs_done, reviews: data.reviews });
    } catch (err) {
      console.log("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvatar = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/app/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setAvatarUri(data.profile_picture || null);
      setUsername(data.username || "");
    } catch (err) {
      console.log("Failed to fetch avatar:", err);
    }
  };

  const fetchUnreadCount = async () => {   // ← added
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/app/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const convos = await res.json();
      const total = convos.reduce(
        (sum: number, c: any) => sum + (c.unread_count ?? 0),
        0
      );
      setUnreadCount(total);
    } catch (err) {
      console.log("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    requestLocation();
    fetchStats();
    fetchAvatar();
    fetchUnreadCount();  // ← added
  }, []);

  const handleManualSubmit = async () => {
    if (!manualCity.trim() || !manualState.trim()) return;
    setSavingLocation(true);
    await saveLocationToProfile({ city: manualCity.trim(), state: manualState.trim() });
    setSavingLocation(false);
    setShowManualLocation(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 12 : 24 }]}>
          <Text style={styles.logo}>CRAFTD</Text>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push("/messages")}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.messagesIcon}>💬</Text>
            {unreadCount > 0 && (        // ← now live
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.greetingRow}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarCircle} />
          ) : (
            <View style={[styles.avatarCircle, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {username?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.subGreeting}>What would you like to do today?</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator color="#F5A623" size="small" />
            ) : (
              <Text style={styles.statNumber}>{stats.jobs_done}</Text>
            )}
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator color="#F5A623" size="small" />
            ) : (
              <Text style={styles.statNumber}>{stats.reviews}</Text>
            )}
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/skills")}>
          <Text style={styles.actionIcon}>🛠</Text>
          <View>
            <Text style={styles.actionTitle}>My Skills</Text>
            <Text style={styles.actionSub}>Add or manage your services</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/categories")}>
          <Text style={styles.actionIcon}>📋</Text>
          <View>
            <Text style={styles.actionTitle}>Browse Categories</Text>
            <Text style={styles.actionSub}>Explore different job types</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/received-bookings")}>
          <Text style={styles.actionIcon}>📅</Text>
          <View>
            <Text style={styles.actionTitle}>My Requests</Text>
            <Text style={styles.actionSub}>See requests from your clients</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/my-bookings")}>
          <Text style={styles.actionIcon}>📤</Text>
          <View>
            <Text style={styles.actionTitle}>My Bookings</Text>
            <Text style={styles.actionSub}>Track requests you've sent</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/nearby-provider")}>
          <Text style={styles.actionIcon}>📍</Text>
          <View>
            <Text style={styles.actionTitle}>Nearby Providers</Text>
            <Text style={styles.actionSub}>Find tradespeople close to you</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showManualLocation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set your location</Text>
            <Text style={styles.modalSub}>
              We couldn't access your location. Enter it manually so nearby pros
              and clients can find you.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="City (e.g. Lagos)"
              placeholderTextColor="#999"
              value={manualCity}
              onChangeText={setManualCity}
            />
            <TextInput
              style={styles.input}
              placeholder="State (e.g. Lagos State)"
              placeholderTextColor="#999"
              value={manualState}
              onChangeText={setManualState}
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleManualSubmit}
              disabled={savingLocation}
            >
              {savingLocation ? (
                <ActivityIndicator color="#1C1C1E" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowManualLocation(false)}>
              <Text style={styles.modalSkipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 22, fontWeight: "800", color: "#F5A623", letterSpacing: 2 },
  messagesButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F5A623",
  },
  messagesIcon: { fontSize: 26 },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F5A623",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "700", color: "#1C1C1E" },

  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
    gap: 14,
  },
  avatarCircle: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: {
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#F5A623" },
  greeting: { fontSize: 26, fontWeight: "700", color: "#FAF7F2", marginBottom: 4 },
  subGreeting: { fontSize: 14, color: "#999" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#F5A623", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#999" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAF7F2",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: { fontSize: 28, marginRight: 16 },
  actionTitle: { fontSize: 15, fontWeight: "600", color: "#FAF7F2", marginBottom: 2 },
  actionSub: { fontSize: 12, color: "#999" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAF7F2",
    marginBottom: 8,
  },
  modalSub: { fontSize: 13, color: "#999", marginBottom: 20, lineHeight: 18 },
  input: {
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    padding: 14,
    color: "#FAF7F2",
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  modalSaveButton: {
    backgroundColor: "#F5A623",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  modalSaveText: { color: "#1C1C1E", fontWeight: "700", fontSize: 15 },
  modalSkipText: { color: "#999", fontSize: 13, textAlign: "center" },
});