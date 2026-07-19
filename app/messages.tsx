import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

type Conversation = {
  id: number;
  other_user_id: number;
  other_username: string;
  last_message: { content: string; sender_id: number; created_at: string } | null;
  unread_count: number;
  updated_at: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const token = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`${API_BASE_URL}/app/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.log("fetchConversations error:", err);
      setError("Couldn't load messages. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [fetchConversations])
  );

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: "/conversation/[id]",
          params: {
            id: String(item.id),
            otherUsername: item.other_username,
            otherUserId: String(item.other_user_id), // ← added
          },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.other_username?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{item.other_username}</Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.last_message?.content ?? "No messages yet"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#F5A623" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptySub}>{error}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>
            Conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          onRefresh={fetchConversations}
          refreshing={loading}
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  centered: {
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
  emptySub: { fontSize: 13, color: "#999", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F5A623",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#1C1C1E", fontWeight: "700", fontSize: 18 },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { color: "#FAF7F2", fontSize: 15, fontWeight: "600" },
  preview: { color: "#999", fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: "#F5A623",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#1C1C1E", fontSize: 11, fontWeight: "700" },
});