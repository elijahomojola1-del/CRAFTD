import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { API_BASE_URL } from '../../config/api';

export default function BookingScreen() {
  const router = useRouter();
  const { gigId, gigTitle, gigPrice } = useLocalSearchParams<{
    gigId: string;
    gigTitle: string;
    gigPrice: string;
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
      const token = await SecureStore.getItemAsync('accessToken');
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{'< Back'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Book This Gig</Text>
          <Text style={styles.gigTitle}>{gigTitle}</Text>
          <Text style={styles.gigPrice}>₦{gigPrice}</Text>

          <Text style={styles.label}>Proposed Date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15-07-2026"
            placeholderTextColor="#999"
            value={proposedDate}
            onChangeText={setProposedDate}
          />

          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any details for the provider..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#1C1C1E" />
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
  safe: { flex: 1, backgroundColor: '#1C1C1E' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
  backButton: { color: '#F5A623', fontSize: 16 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { color: '#FAF7F2', fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  gigTitle: { color: '#FAF7F2', fontSize: 16, marginBottom: 2 },
  gigPrice: { color: '#F5A623', fontSize: 18, fontWeight: '700', marginBottom: 24 },
  label: { color: '#F5A623', fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FAF7F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#F5A623',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: { color: '#1C1C1E', fontSize: 16, fontWeight: '700' },
});