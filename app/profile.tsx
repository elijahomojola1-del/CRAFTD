import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { getToken } from "../utils/tokenStorage";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import { colors } from "../constants/theme";
import { Alert } from "../utils/alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

// Grid layout math: 3 columns, with consistent gaps on both sides and between tiles
const GRID_PADDING = 20;
const GRID_GAP = 8;
const GRID_COLUMNS = 3;
const TILE_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const [profileRes, portfolioRes] = await Promise.all([
        fetch(`${API_BASE_URL}/app/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/app/portfolio/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setBio(data.bio || "");
        setLocation(data.location || "");
        setPhoneNumber(data.phone_number || "");
      }

      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data);
      }
    } catch (err) {
      console.log("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/app/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio,
          location,
          phone_number: phoneNumber,
        }),
      });

      if (!response.ok) {
        Alert.alert("Error", "Failed to update profile. Please try again.");
        return;
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to update your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    try {
      setUploadingAvatar(true);
      const token = await getToken();
      const asset = result.assets[0];

      const formData = new FormData();
      formData.append("profile_picture", {
        uri: asset.uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_BASE_URL}/app/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        Alert.alert("Error", "Failed to update profile picture. Please try again.");
        return;
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.log("Error uploading avatar:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    if (!profile?.profile_picture) {
      // No photo yet — nothing to view, go straight to picking one
      handleAvatarUpload();
      return;
    }

    Alert.alert("Profile Photo", undefined, [
      { text: "View Photo", onPress: () => setAvatarModalVisible(true) },
      { text: "Change Photo", onPress: handleAvatarUpload },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddPortfolioImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add portfolio images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      setUploading(true);
      const token = await getToken();
      const asset = result.assets[0];

      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: "portfolio.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_BASE_URL}/app/portfolio/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        Alert.alert("Error", "Failed to upload image. Please try again.");
        return;
      }

      const data = await response.json();
      setPortfolio((prev) => [data, ...prev]);
    } catch (err) {
      console.log("Error uploading portfolio image:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolioImage = async (id: number) => {
    Alert.alert("Delete photo?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/app/portfolio/${id}/`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              setPortfolio((prev) => prev.filter((item) => item.id !== id));
            }
          } catch (err) {
            console.log("Error deleting portfolio image:", err);
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">My Profile</Text>
        <TouchableOpacity accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push("/settings")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.avatarWrap}
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
          >
            {profile?.profile_picture ? (
              <Image
                source={{ uri: profile.profile_picture }}
                style={styles.avatar}
                accessible
                accessibilityLabel="Your profile photo"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {profile?.username?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={styles.avatarEditText}>✎</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.username}>{profile?.username}</Text>
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.gigCount}>
            {profile?.gig_count || 0} gig{profile?.gig_count === 1 ? "" : "s"} posted
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about yourself"
              accessibilityLabel="Bio"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Lagos, Nigeria"
              accessibilityLabel="Location"
              returnKeyType="next"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g. 08012345678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </View>

          <TouchableOpacity accessibilityRole="button"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.portfolioSection}>
            <Text style={styles.label}>Portfolio</Text>

            <View style={styles.grid}>
              {portfolio.map((item, index) => (
                <TouchableOpacity accessibilityRole="button"
                  key={item.id}
                  accessibilityLabel={`Portfolio photo ${index + 1}. Hold to delete.`}
                  style={styles.gridTile}
                  onPress={() => setViewingIndex(index)}
                  onLongPress={() => handleDeletePortfolioImage(item.id)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.gridImage}
                    accessible
                    accessibilityLabel={item.caption || `Portfolio photo ${index + 1}`}
                  />
                </TouchableOpacity>
              ))}

              <TouchableOpacity accessibilityRole="button"
                accessibilityLabel="Add a portfolio photo"
                style={[styles.gridTile, styles.addTile]}
                onPress={handleAddPortfolioImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.addPortfolioText}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            {portfolio.length > 0 && (
              <Text style={styles.portfolioHint}>Hold a photo to delete it</Text>
            )}
          </View>

          {/* Portfolio photo viewer */}
          <Modal
            visible={viewingIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setViewingIndex(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity accessibilityRole="button"
                accessibilityLabel="Close photo"
                style={styles.modalClose}
                onPress={() => setViewingIndex(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              {viewingIndex !== null && (
                <FlatList
                  style={styles.modalFlatList}
                  data={portfolio}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  pagingEnabled
                  initialScrollIndex={viewingIndex}
                  getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <View style={styles.modalImageWrap}>
                      <Image
                        accessible
                        accessibilityLabel={item.caption || `Portfolio photo ${index + 1}`}
                        source={{ uri: item.image }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                />
              )}
            </View>
          </Modal>

          {/* Profile photo viewer */}
          <Modal
            visible={avatarModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setAvatarModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity accessibilityRole="button"
                accessibilityLabel="Close photo"
                style={styles.modalClose}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.modalImageWrap}>
                <Image
                  accessible
                  accessibilityLabel="Your profile photo"
                  source={{ uri: profile?.profile_picture }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  settingsIcon: { fontSize: 20, color: colors.primary },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginBottom: 28, alignSelf: "center" },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: colors.primary },
  avatarEditBadge: {
    position: "absolute",
    bottom: 8,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarEditText: { fontSize: 12, color: colors.onPrimary, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  username: { fontSize: 20, fontWeight: "700", color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: colors.onPrimary },
  gigCount: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" },
  fieldGroup: { marginBottom: 20, marginTop: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  value: { fontSize: 15, color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
  portfolioSection: { marginTop: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: GRID_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  gridImage: { width: "100%", height: "100%" },
  addTile: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  addPortfolioText: { fontSize: 28, color: colors.primary, fontWeight: "700" },
  portfolioHint: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalCloseText: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: "700",
  },
  modalFlatList: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});