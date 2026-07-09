import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
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

export default function AddSkillScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
console.log("Token for gig POST:", token);

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

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Custom Suit Tailoring"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what you offer..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const selected = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => setCategory(cat.value)}
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
          style={styles.input}
          placeholder="e.g. 5000"
          placeholderTextColor="#999"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lagos"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <Text style={styles.submitButtonText}>Post Skill</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1C1C1E" },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
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