import { useLocalSearchParams, useRouter } from 'expo-router';
import { getToken } from '../../utils/tokenStorage';
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
import { Alert } from '../../utils/alert';
import { API_BASE_URL } from '../../config/api';

export default function BookingScreen() {
  const router = useRouter();
  const { gigId, gigTitle } = useLocalSearchParams<{
    gigId: string;
    gigTitle: string;
  }>();

  const [proposedDate, setProposedDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
const toISODate = (input: string) => {
  const [day, month, year] = input.split('-').map((p) => p.trim());
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
};
  const handleSubmit = async () => {
    if (!proposedDate.trim()) {
      Alert.alert('Missing date', 'Please enter a proposed date.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/app/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gig: Number(gigId),
          proposed_date: `${toISODate(proposedDate)}T00:00:00`,
          message,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log('Booking error:', errText);
        Alert.alert('Booking failed', 'Please check your details and try again.');
        return;
      }

      Alert.alert('Request sent', 'Your booking request has been sent.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log('Booking request error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <TextInput
            style={styles.input}
            placeholder="e.g. 15-07-2026"
            accessibilityLabel="Proposed date, as day, month, year"
            returnKeyType="next"
            placeholderTextColor={colors.textMuted}
            value={proposedDate}
            onChangeText={setProposedDate}
          />

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