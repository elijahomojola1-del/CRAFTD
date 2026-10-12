import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getToken } from "../utils/tokenStorage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { apiErrorMessage, apiRequest } from "../utils/api";
import { appendImage } from "../utils/upload";
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
  // With an id this screen edits that skill; without one it adds a new skill.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  // The photo already saved on the server, and a newly picked one (if any).
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [gigCount, setGigCount] = useState(0);
  const limitReached = !isEditing && gigCount >= MAX_GIGS;

  useEffect(() => {
    const load = async () => {
      if (isEditing) {
        const result = await apiRequest(`/app/gigs/${id}/`, {
          fallbackError: "Could not load this skill.",
        });
        if (result.ok && result.data) {
          setTitle(result.data.title || "");
          setDescription(result.data.description || "");
          setCategory(result.data.category || null);
          setLocation(result.data.location || "");
          setExistingImage(result.data.image || null);
        } else {
          setError(result.error);
        }
      } else {
        const result = await apiRequest("/app/gigs/?mine=true");
        if (result.ok && Array.isArray(result.data)) {
          setGigCount(result.data.length);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, isEditing]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add a photo to your skill.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (limitReached) {
      setError(`You can only have ${MAX_GIGS} skills at a time. Remove one before adding another.`);
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your skill.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe what you offer.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("location", location.trim());
      if (pickedImage) {
        await appendImage(formData, "image", pickedImage, "skill.jpg");
      }

      const response = await fetch(
        isEditing ? `${API_BASE_URL}/app/gigs/${id}/` : `${API_BASE_URL}/app/gigs/`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(apiErrorMessage(data, "Could not save your skill. Please try again."));
        return;
      }

      // Back to My Skills, which reloads the list.
      if (isEditing) {
        router.replace("/skills");
      } else {
        router.back();
      }
    } catch (err) {
      console.log("Network error saving gig:", err);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const photo = pickedImage || existingImage;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title} accessibilityRole="header">
            {isEditing ? "Edit Skill" : "Add a Skill"}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {isEditing ? null : limitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitTitle}>You&apos;ve reached your skill limit</Text>
            <Text style={styles.limitSub}>
              Each profile can have up to {MAX_GIGS} skills. Open one in My Skills and delete it to add a new one.
            </Text>
          </View>
        ) : (
          <Text style={styles.limitCounter}>
            {gigCount} / {MAX_GIGS} skills used
          </Text>
        )}

        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={photo ? "Change the photo for this skill" : "Add a photo for this skill"}
          style={[styles.photoBox, limitReached && styles.inputDisabled]}
          onPress={pickImage}
          disabled={limitReached}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} accessible accessibilityLabel="Skill photo" />
          ) : (
            <Text style={styles.photoHint}>+ Add a photo of your work</Text>
          )}
        </TouchableOpacity>
        {photo ? <Text style={styles.photoChange}>Tap the photo to change it</Text> : null}

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
          maxLength={120}
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
          maxLength={120}
        />

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

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
              {limitReached ? "Limit Reached" : isEditing ? "Save Changes" : "Post Skill"}
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
  photoBox: {
    height: 170,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoHint: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  photoChange: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
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
  errorText: { color: colors.danger, fontSize: 14, marginTop: 20 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
});
