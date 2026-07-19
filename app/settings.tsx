import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingsRowProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsRow({ label, onPress, destructive, showChevron = true }: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {showChevron && !destructive && <Text style={styles.chevron}>{">"}</Text>}
    </TouchableOpacity>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to log in again to access your account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("accessToken");
            router.replace("/login");
          } catch (err) {
            console.log("Error logging out:", err);
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  const comingSoon = (feature: string) => {
    Alert.alert(feature, "This is coming soon.");
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Account">
          <SettingsRow label="Edit Profile" onPress={() => router.push("/profile")} />
          <SettingsRow label="Change Password" onPress={() => comingSoon("Change Password")} />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            label="Notification Preferences"
            onPress={() => comingSoon("Notification Preferences")}
          />
        </SettingsSection>

        <SettingsSection title="Location">
          <SettingsRow label="Update City & State" onPress={() => comingSoon("Update Location")} />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow label="Help & FAQ" onPress={() => comingSoon("Help & FAQ")} />
          <SettingsRow label="Contact Support" onPress={() => comingSoon("Contact Support")} />
          <SettingsRow label="Terms & Privacy Policy" onPress={() => comingSoon("Terms & Privacy")} />
        </SettingsSection>

        <SettingsSection title="">
          <SettingsRow label="Log Out" onPress={handleLogout} destructive showChevron={false} />
        </SettingsSection>
      </ScrollView>
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
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: { color: "#F5A623", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#FAF7F2" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  sectionBody: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A3A3C",
  },
  rowLabel: { fontSize: 15, color: "#FAF7F2", fontWeight: "500" },
  rowLabelDestructive: { color: "#FF6B6B", fontWeight: "700" },
  chevron: { fontSize: 16, color: "#666" },
});