import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

const CATEGORIES = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "writing", label: "Writing" },
  { value: "tutoring", label: "Tutoring" },
  { value: "marketing", label: "Marketing" },
  { value: "business_support", label: "Business Support" },
  { value: "home_repairs", label: "Home Repairs" },
  { value: "cleaning", label: "Cleaning" },
  { value: "construction", label: "Construction" },
  { value: "automotive", label: "Automotive" },
  { value: "beauty_fashion", label: "Beauty & Fashion" },
  { value: "events", label: "Events" },
  { value: "transport_errands", label: "Transport & Errands" },
  { value: "health_fitness", label: "Health & Fitness" },
];

const MAX_GIGS = 3;

export default function AddSkillScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [checkingLimit, setCheckingLimit] = useState(true);
  const [gigCount, setGigCount] = useState(0);
  const limitReached = gigCount >= MAX_GIGS;

  const checkGigLimit = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`${API_BASE_URL}/app/gigs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : data.count ?? 0;
        setGigCount(count);
      }
    } catch (err) {
      console.log("Failed to check gig limit:", err);
    } finally {
      setCheckingLimit(false);
    }
  };

  useEffect(() => {
    checkGigLimit();
  }, []);

  const handleSubmit = async () => {
    if (limitReached) {
      Alert.alert(
        "Skill limit reached",
        `You can only have ${MAX_GIGS} skills at a time. Remove one before adding another.`
      );
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for your skill.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing description", "Please describe what you offer.");
      return;
    }
    if (!category) {
      Alert.alert("Missing category", "Please select a category.");
      return;
    }
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert("Invalid price", "Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(`${API_BASE_URL}/app/gigs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          price: Number(price),
          location: location.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Gig creation failed:", response.status, errorText);
        Alert.alert("Error", "Could not create your skill. Please try again.");
        setSubmitting(false);
        return;
      }

      Alert.alert("Success", "Your skill has been added!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log("Network error creating gig:", err);
      Alert.alert("Network error", "Could not reach the server. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingLimit) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color="#F5A623" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add a Skill</Text>
          <View style={{ width: 50 }} />
        </View>

        {limitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitTitle}>You've reached your skill limit</Text>
            <Text style={styles.limitSub}>
              Each profile can have up to {MAX_GIGS} skills. Remove one from "My Skills" to add a new one.
            </Text>
          </View>
        ) : (
          <Text style={styles.limitCounter}>
            {gigCount} / {MAX_GIGS} skills used
          </Text>
        )}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          placeholder="e.g. Custom Suit Tailoring"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!limitReached}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, limitReached && styles.inputDisabled]}
          placeholder="Describe what you offer..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!limitReached}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const selected = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => !limitReached && setCategory(cat.value)}
                disabled={limitReached}
              >
                <Text
                  style={[
                    styles.tileText,
                    selected && styles.tileTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Price (₦)</Text>
        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          placeholder="e.g. 5000"
          placeholderTextColor="#999"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          editable={!limitReached}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          placeholder="e.g. Lagos"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
          editable={!limitReached}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || limitReached) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || limitReached}
        >
          {submitting ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <Text style={styles.submitButtonText}>
              {limitReached ? "Limit Reached" : "Post Skill"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  limitCounter: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  limitBanner: {
    backgroundColor: "#2A2A2E",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5A623",
    padding: 16,
    marginBottom: 16,
  },
  limitTitle: { color: "#F5A623", fontSize: 15, fontWeight: "700", marginBottom: 6 },
  limitSub: { color: "#CFCFCF", fontSize: 13, lineHeight: 18 },
  label: {
    color: "#FAF7F2",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2A2A2E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FAF7F2",
    fontSize: 15,
  },
  inputDisabled: { opacity: 0.4 },
  textArea: { height: 100, textAlignVertical: "top" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2A2A2E",
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  tileSelected: {
    backgroundColor: "#F5A623",
    borderColor: "#F5A623",
  },
  tileText: { color: "#FAF7F2", fontSize: 13, fontWeight: "500" },
  tileTextSelected: { color: "#1C1C1E", fontWeight: "700" },
  submitButton: {
    backgroundColor: "#F5A623",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 15 },
});