import { useRouter, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

export default function SkillsScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMySkills = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(`${API_BASE_URL}/app/gigs/?mine=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Failed to fetch my skills:", response.status);
        setSkills([]);
        return;
      }

      const data = await response.json();
      setSkills(data);
    } catch (err) {
      console.log("Error fetching my skills:", err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMySkills();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Skills</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#F5A623" size="large" />
        </View>
      ) : skills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✂</Text>
          <Text style={styles.emptyTitle}>No skills added yet</Text>
          <Text style={styles.emptySub}>
            Add a service you offer to start getting hired
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-skill")}
          >
            <Text style={styles.addButtonText}>+ Add a Skill</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/gig/${item.id}?mine=true`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardLocation}>{item.location}</Text>
                <Text style={styles.cardPrice}>₦{item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addButtonFooter}
              onPress={() => router.push("/add-skill")}
            >
              <Text style={styles.addButtonText}>+ Add a Skill</Text>
            </TouchableOpacity>
          }
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
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FAF7F2",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonFooter: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: 20,
  },
  addButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardImage: { width: 90, height: 90 },
  cardImagePlaceholder: { backgroundColor: "#3A3A3C" },
  cardInfo: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { color: "#FAF7F2", fontSize: 15, fontWeight: "600" },
  cardLocation: { color: "#999", fontSize: 12, marginTop: 4 },
  cardPrice: { color: "#F5A623", fontSize: 14, fontWeight: "700", marginTop: 6 },
});