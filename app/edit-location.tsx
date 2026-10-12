import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import { formStyles as styles } from '../constants/formStyles';
import { colors } from '../constants/theme';
import { apiRequest } from '../utils/api';

export default function EditLocationScreen() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const stateRef = useRef<TextInput>(null);

  useEffect(() => {
    apiRequest('/app/profile/', { fallbackError: 'Could not load your location.' }).then((result) => {
      if (result.ok && result.data) {
        setCity(result.data.city || '');
        setState(result.data.state || '');
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!city.trim() || !state.trim()) {
      setError('Enter both your city and your state.');
      return;
    }
    setError('');
    setSaved(false);
    setBusy(true);
    const result = await apiRequest('/app/profile/', {
      method: 'PATCH',
      body: { city: city.trim(), state: state.trim() },
      fallbackError: 'Could not save your location.',
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">City & State</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            This is shown on your profile so people nearby can find you.
          </Text>

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lagos"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="City"
            returnKeyType="next"
            onSubmitEditing={() => stateRef.current?.focus()}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            ref={stateRef}
            style={styles.input}
            placeholder="e.g. Lagos State"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="State"
            returnKeyType="done"
            onSubmitEditing={handleSave}
            value={state}
            onChangeText={setState}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          {saved ? (
            <Text style={styles.success} accessibilityRole="alert">
              Your location has been saved.
            </Text>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
