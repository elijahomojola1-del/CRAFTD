import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/theme';
import BackButton from '../../components/BackButton';
import DateStrip from '../../components/DateStrip';
import { Alert } from '../../utils/alert';
import { apiRequest } from '../../utils/api';

export default function BookingScreen() {
  const router = useRouter();
  const { gigId, gigTitle } = useLocalSearchParams<{
    gigId: string;
    gigTitle: string;
  }>();

  // Picked day as YYYY-MM-DD.
  const [proposedDate, setProposedDate] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!proposedDate) {
      setError('Pick a date for the job.');
      return;
    }

    setError('');
    setSubmitting(true);
    const result = await apiRequest('/app/bookings/', {
      method: 'POST',
      body: {
        gig: Number(gigId),
        // Midday, so the day never shifts when shown in another time zone.
        proposed_date: `${proposedDate}T12:00:00`,
        message: message.trim(),
      },
      fallbackError: 'Your request was not sent. Please check your details and try again.',
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    Alert.alert('Request sent', 'Your booking request has been sent.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">Book This Gig</Text>
          <Text style={styles.gigTitle}>{gigTitle}</Text>
          <Text style={styles.gigPrice}>Price negotiable — discuss with provider</Text>

          <Text style={styles.label}>Proposed Date</Text>
          <DateStrip value={proposedDate} onChange={setProposedDate} />

          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any details for the provider..."
            accessibilityLabel="Message to the provider, optional"
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
          />

          {error ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity accessibilityRole="button"
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>Send Booking Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorText: { color: colors.danger, fontSize: 14, marginTop: 16 },
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
  backButton: { color: colors.primary, fontSize: 16 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  gigTitle: { color: colors.text, fontSize: 16, marginBottom: 2 },
  gigPrice: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic', marginBottom: 24 },
  label: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
});