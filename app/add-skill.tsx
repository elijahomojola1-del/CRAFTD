import { useRouter } from "expo-router";
import { getToken } from "../utils/tokenStorage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import BackButton from "../components/BackButton";
import { Alert } from "../utils/alert";
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
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [checkingLimit, setCheckingLimit] = useState(true);
  const [gigCount, setGigCount] = useState(0);
  const limitReached = gigCount >= MAX_GIGS;

  const checkGigLimit = async () => {
    try {
      const token = await getToken();
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

    setSubmitting(true);
    try {
      const token = await getToken();

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
          // Prices are agreed in chat, not listed. The API still requires the field.
          price: 0,
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
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title} accessibilityRole="header">Add a Skill</Text>
          <View style={{ width: 50 }} />
        </View>

        {limitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitTitle}>You&apos;ve reached your skill limit</Text>
            <Text style={styles.limitSub}>
              Each profile can have up to {MAX_GIGS} skills. Remove one from My Skills to add a new one.
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
          accessibilityLabel="Skill title"
          returnKeyType="next"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          editable={!limitReached}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, limitReached && styles.inputDisabled]}
          placeholder="Describe what you offer..."
          accessibilityLabel="Description"
          placeholderTextColor={colors.textMuted}
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
              <TouchableOpacity accessibilityRole="button"
                key={cat.value}
                accessibilityState={{ selected, disabled: limitReached }}
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

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          placeholder="e.g. Lagos"
          accessibilityLabel="Location"
          returnKeyType="done"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
          editable={!limitReached}
        />

        <TouchableOpacity accessibilityRole="button"
          style={[
            styles.submitButton,
            (submitting || limitReached) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || limitReached}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
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
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  limitCounter: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  limitBanner: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    marginBottom: 16,
  },
  limitTitle: { color: colors.primary, fontSize: 15, fontWeight: "700", marginBottom: 6 },
  limitSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  tileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tileText: { color: colors.text, fontSize: 13, fontWeight: "500" },
  tileTextSelected: { color: colors.onPrimary, fontWeight: "700" },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
});