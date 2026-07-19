import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";

type Message = {
  id: number;
  sender: number;
  sender_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export default function ConversationThreadScreen() {
  const router = useRouter();
  const { id, otherUsername, otherUserId } = useLocalSearchParams<{
    id: string;
    otherUsername?: string;
    otherUserId?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const getToken = () => SecureStore.getItemAsync("accessToken");

  const fetchCurrentUser = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/app/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUsername(data.username);
      }
    } catch (err) {
      console.log("fetchCurrentUser error:", err);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE_URL}/app/conversations/${id}/messages/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.log("fetchMessages error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCurrentUser();
      fetchMessages();
    }, [fetchMessages])
  );

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE_URL}/app/conversations/${id}/messages/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error(`Send failed: ${res.status}`);
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    } catch (err) {
      console.log("send error:", err);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleViewProfile = () => {
    if (otherUserId) {
      router.push({
        pathname: "/provider/[id]",
        params: { id: otherUserId },
      });
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    // ← username comparison — more reliable than JWT decode
    const isMine =
      currentUsername != null &&
      item.sender_username === currentUsername;

    return (
      <View
        style={[
          styles.bubbleRow,
          isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text
            style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}
          >
            {item.content}
          </Text>

          {/* Timestamp + read receipt */}
          <View style={styles.metaRow}>
            <Text
              style={isMine ? styles.timeTextMine : styles.timeTextTheirs}
            >
              {formatTime(item.created_at)}
            </Text>
            {isMine && (
              <Text style={styles.readReceipt}>
                {item.is_read ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleViewProfile} activeOpacity={0.7}>
          <Text style={styles.title}>{otherUsername ?? "Chat"}</Text>
          {otherUserId && (
            <Text style={styles.viewProfile}>View Profile →</Text>
          )}
        </TouchableOpacity>

        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#F5A623" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            onFocus={() =>
              setTimeout(
                () => listRef.current?.scrollToEnd({ animated: true }),
                300
              )
            }
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#777"
              multiline
              onFocus={() =>
                setTimeout(
                  () => listRef.current?.scrollToEnd({ animated: true }),
                  300
                )
              }
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FAF7F2",
    textAlign: "center",
  },
  viewProfile: {
    fontSize: 11,
    color: "#F5A623",
    textAlign: "center",
    marginTop: 2,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  bubbleRow: { flexDirection: "row", marginBottom: 10 },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleMine: { backgroundColor: "#F5A623", borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#2C2C2E", borderBottomLeftRadius: 4 },
  bubbleTextMine: { color: "#1C1C1E", fontSize: 15, fontWeight: "500" },
  bubbleTextTheirs: { color: "#FAF7F2", fontSize: 15 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  timeTextMine: { fontSize: 10, color: "rgba(28,28,30,0.65)" },
  timeTextTheirs: { fontSize: 10, color: "#666" },
  readReceipt: {
    fontSize: 11,
    color: "rgba(28,28,30,0.7)",
    fontWeight: "700",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    backgroundColor: "#1C1C1E",
  },
  input: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    color: "#FAF7F2",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 120,
    minHeight: 46,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#F5A623",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: "#1C1C1E", fontSize: 15, fontWeight: "700" },
});