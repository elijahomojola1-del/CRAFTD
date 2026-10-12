import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { Alert } from '../utils/alert';
import { apiRequest } from '../utils/api';
import { clearToken } from '../utils/tokenStorage';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const deleteAccount = async () => {
    setError('');
    setBusy(true);
    const result = await apiRequest('/app/delete-account/', {
      method: 'POST',
      body: { password },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await clearToken();
    router.replace('/');
  };

  const confirmDelete = () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, skills, bookings, messages and reviews. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Deleting your account permanently removes your profile, photos, skills, bookings,
          messages and the reviews you wrote or received. This cannot be undone.
        </Text>

        <Text style={styles.label}>Enter your password to confirm</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.dangerButton, busy && styles.buttonDisabled]}
          onPress={confirmDelete}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={styles.dangerButtonText}>Delete My Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
