import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { API_BASE_URL } from "../config/api";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");

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
      const token = await SecureStore.getItemAsync("accessToken");

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

  const handleAddPortfolioImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add portfolio images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      setUploading(true);
      const token = await SecureStore.getItemAsync("accessToken");
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
            const token = await SecureStore.getItemAsync("accessToken");
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

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("accessToken");
      router.replace("/login");
    } catch (err) {
      console.log("Error logging out:", err);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#F5A623" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrap}>
            {profile?.profile_picture ? (
              <View style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {profile?.username?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g. 08012345678"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.portfolioSection}>
            <Text style={styles.label}>Portfolio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {portfolio.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.portfolioThumbWrap}
                  onPress={() => setViewingIndex(index)}
                  onLongPress={() => handleDeletePortfolioImage(item.id)}
                >
                  <Image source={{ uri: item.image }} style={styles.portfolioThumb} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addPortfolioTile}
                onPress={handleAddPortfolioImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#F5A623" />
                ) : (
                  <Text style={styles.addPortfolioText}>+</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
            {portfolio.length > 0 && (
              <Text style={styles.portfolioHint}>Hold a photo to delete it</Text>
            )}
          </View>

          <Modal
            visible={viewingIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setViewingIndex(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setViewingIndex(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              {viewingIndex !== null && (
                <FlatList
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
                  renderItem={({ item }) => (
                    <View style={styles.modalImageWrap}>
                      <Image
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

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
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
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: "#F5A623" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  username: { fontSize: 20, fontWeight: "700", color: "#FAF7F2" },
  verifiedBadge: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: "#1C1C1E" },
  gigCount: { fontSize: 13, color: "#999", marginTop: 6, textAlign: "center" },
  fieldGroup: { marginBottom: 20, marginTop: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#999", marginBottom: 6 },
  value: { fontSize: 15, color: "#FAF7F2" },
  input: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#FAF7F2",
  },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: "#F5A623",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#1C1C1E", fontWeight: "700", fontSize: 15 },
  portfolioSection: { marginTop: 10 },
  portfolioThumbWrap: { marginRight: 10 },
  portfolioThumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: "#2C2C2E" },
  addPortfolioTile: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F5A623",
    borderStyle: "dashed",
  },
  addPortfolioText: { fontSize: 28, color: "#F5A623", fontWeight: "700" },
  portfolioHint: { fontSize: 11, color: "#999", marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    color: "#F5A623",
    fontWeight: "700",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#F5A623",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: { color: "#1C1C1E", fontWeight: "700", fontSize: 15 },
});