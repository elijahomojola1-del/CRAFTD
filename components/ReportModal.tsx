import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import { apiRequest } from "../utils/api";

const REASONS = [
  { value: "scam", label: "Scam or fraud" },
  { value: "abuse", label: "Abuse or harassment" },
  { value: "fake", label: "Fake profile or listing" },
  { value: "no_show", label: "Did not show up" },
  { value: "other", label: "Something else" },
];

interface ReportModalProps {
  visible: boolean;
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function ReportModal({ visible, userId, userName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const close = () => {
    setReason(null);
    setDetails("");
    setError("");
    setSent(false);
    onClose();
  };

  const submit = async () => {
    if (!reason) {
      setError("Choose what went wrong.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await apiRequest("/app/reports/", {
      method: "POST",
      body: { reported_user: userId, reason, details: details.trim() },
      fallbackError: "Could not send your report. Please try again.",
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {sent ? (
            <>
              <Text style={styles.title} accessibilityRole="header">Report sent</Text>
              <Text style={styles.sub}>
                Thank you. We will look into it. You can also block {userName} so they can&apos;t
                book or message you.
              </Text>
              <TouchableOpacity accessibilityRole="button" style={styles.submitButton} onPress={close}>
                <Text style={styles.submitButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title} accessibilityRole="header">Report {userName}</Text>
              <Text style={styles.sub}>What went wrong? Your report is not shown to them.</Text>

              {REASONS.map((item) => {
                const selected = reason === item.value;
                return (
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={item.value}
                    style={[styles.reason, selected && styles.reasonSelected]}
                    onPress={() => setReason(item.value)}
                  >
                    <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TextInput
                style={styles.input}
                placeholder="Add details (optional)"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Details, optional"
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={1000}
              />

              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.submitButton}
                onPress={submit}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>Send Report</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="button" onPress={close} disabled={busy}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  reason: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  reasonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  reasonText: { color: colors.text, fontSize: 14, fontWeight: "500" },
  reasonTextSelected: { color: colors.onPrimary, fontWeight: "700" },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 8,
    marginBottom: 16,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  submitButtonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
  cancelText: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
});
