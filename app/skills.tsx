import { useRouter, useFocusEffect } from "expo-router";
import { getToken } from "../utils/tokenStorage";
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
import { colors } from "../constants/theme";
import BackButton from "../components/BackButton";
import { API_BASE_URL } from "../config/api";

export default function SkillsScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchMySkills = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/app/gigs/?mine=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Failed to fetch my skills:", response.status);
        setLoadError(true);
        return;
      }

      const data = await response.json();
      setSkills(data);
      setLoadError(false);
    } catch (err) {
      console.log("Error fetching my skills:", err);
      setLoadError(true);
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
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">My Skills</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle} accessibilityRole="alert">Couldn&apos;t load your skills</Text>
          <Text style={styles.emptySub}>Check your connection and try again</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.addButton} onPress={fetchMySkills}>
            <Text style={styles.addButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : skills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✂</Text>
          <Text style={styles.emptyTitle}>No skills added yet</Text>
          <Text style={styles.emptySub}>
            Add a service you offer to start getting hired
          </Text>
          <TouchableOpacity accessibilityRole="button"
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
            <TouchableOpacity accessibilityRole="button"
              style={styles.card}
              onPress={() => router.push(`/gig/${item.id}?mine=true`)}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  accessible
                  accessibilityLabel={`Photo for ${item.title}`}
                />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardLocation}>{item.location}</Text>
                <Text style={styles.cardPrice}>Price negotiable</Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity accessibilityRole="button"
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
  safe: { flex: 1, backgroundColor: colors.background },
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
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
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
    color: colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonFooter: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: 20,
  },
  addButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardImage: { width: 90, height: 90 },
  cardImagePlaceholder: { backgroundColor: colors.border },
  cardInfo: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  cardLocation: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  cardPrice: { color: colors.textMuted, fontSize: 13, fontStyle: "italic", marginTop: 6 },
});