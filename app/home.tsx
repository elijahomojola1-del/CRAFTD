import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>CRAFTD</Text>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push("/profile")}>
            <Text style={styles.avatarText}>U</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.subGreeting}>What would you like to do today?</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/messages")}>
          <Text style={styles.actionIcon}>💬</Text>
          <View>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSub}>Chat with clients</Text>
          </View>
        </TouchableOpacity>

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

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/my-bookings")}>
  <Text style={styles.actionIcon}>📅</Text>
  <Text style={styles.actionTitle}>My Requests</Text>
  <Text style={styles.actionSub}>see requests from your clients</Text>
</TouchableOpacity>
      </ScrollView>  

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10 },
  logo: { fontSize: 22, fontWeight: "800", color: "#F5A623", letterSpacing: 2 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F5A623", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#1C1C1E", fontWeight: "700", fontSize: 16 },
  greetingSection: { marginBottom: 28 },
  greeting: { fontSize: 26, fontWeight: "700", color: "#FAF7F2", marginBottom: 4 },
  subGreeting: { fontSize: 14, color: "#999" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32, gap: 10 },
  statCard: { flex: 1, backgroundColor: "#2C2C2E", borderRadius: 12, padding: 16, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#F5A623", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#999" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#FAF7F2", marginBottom: 12 },
  actionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#2C2C2E", borderRadius: 12, padding: 16, marginBottom: 12 },
  actionIcon: { fontSize: 28, marginRight: 16 },
  actionTitle: { fontSize: 15, fontWeight: "600", color: "#FAF7F2", marginBottom: 2 },
  actionSub: { fontSize: 12, color: "#999" },
  logoutButton: { marginHorizontal: 24, marginBottom: 24, borderWidth: 1, borderColor: "#F5A623", alignItems: "center", paddingVertical: 14, borderRadius: 10 },
  logoutText: { color: "#F5A623", fontWeight: "600", fontSize: 14 },
});