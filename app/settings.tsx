import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { clearToken } from "../utils/tokenStorage";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import BackButton from "../components/BackButton";
import { BUSINESS } from "../config/business";
import { Alert } from "../utils/alert";
import { apiRequest } from "../utils/api";

interface SettingsRowProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsRow({ label, onPress, destructive, showChevron = true }: SettingsRowProps) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {showChevron && !destructive && <Text style={styles.chevron} aria-hidden>{">"}</Text>}
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
            await clearToken();
            router.replace("/login");
          } catch (err) {
            console.log("Error logging out:", err);
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  // "I offer services" switches the account between client and provider.
  const [isProvider, setIsProvider] = useState(true);

  useEffect(() => {
    apiRequest("/app/profile/").then((result) => {
      if (result.ok && result.data) setIsProvider(result.data.role !== "client");
    });
  }, []);

  const toggleProvider = async (value: boolean) => {
    setIsProvider(value);
    const result = await apiRequest("/app/profile/", {
      method: "PATCH",
      body: { role: value ? "provider" : "client" },
      fallbackError: "Could not update this setting.",
    });
    if (!result.ok) {
      setIsProvider(!value);
      Alert.alert("Error", result.error);
    }
  };

  const contactSupport = () => {
    Linking.openURL(`mailto:${BUSINESS.supportEmail}?subject=${encodeURIComponent("CRAFTD support")}`).catch(() =>
      Alert.alert("Contact Support", `Email us at ${BUSINESS.supportEmail}`)
    );
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Account">
          <SettingsRow label="Edit Profile" onPress={() => router.push("/profile")} />
          <SettingsRow label="Change Password" onPress={() => router.push("/change-password")} />
          <SettingsRow label="Subscription" onPress={() => router.push("/subscribe")} />
          <View style={styles.row}>
            <View style={styles.switchText}>
              <Text style={styles.rowLabel}>I offer services</Text>
              <Text style={styles.rowHint}>Show My Skills and Job Requests on Home</Text>
            </View>
            <Switch
              accessibilityLabel="I offer services"
              value={isProvider}
              onValueChange={toggleProvider}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </SettingsSection>

        {Platform.OS !== "web" && (
          <SettingsSection title="Notifications">
            <SettingsRow label="Notification Settings" onPress={() => Linking.openSettings()} />
          </SettingsSection>
        )}

        <SettingsSection title="Location">
          <SettingsRow label="Update City & State" onPress={() => router.push("/edit-location")} />
        </SettingsSection>

        <SettingsSection title="Privacy & Safety">
          <SettingsRow label="Blocked Users" onPress={() => router.push("/blocked-users")} />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow label="Help & FAQ" onPress={() => router.push("/help")} />
          {BUSINESS.supportEmail.trim() !== "" && (
            <SettingsRow label="Contact Support" onPress={contactSupport} />
          )}
          <SettingsRow label="Terms & Privacy Policy" onPress={() => router.push("/terms")} />
        </SettingsSection>

        <SettingsSection title="">
          <SettingsRow label="Log Out" onPress={handleLogout} destructive showChevron={false} />
          <SettingsRow
            label="Delete Account"
            onPress={() => router.push("/delete-account")}
            destructive
            showChevron={false}
          />
        </SettingsSection>
      </ScrollView>
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
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  sectionBody: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: "500" },
  switchText: { flex: 1, paddingRight: 12 },
  rowHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowLabelDestructive: { color: colors.danger, fontWeight: "700" },
  chevron: { fontSize: 16, color: colors.textMuted },
});