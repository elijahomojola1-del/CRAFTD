import { useRef, useState } from 'react';
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

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const newPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) {
      setError('Enter your current password and a new one.');
      return;
    }
    setError('');
    setDone(false);
    setBusy(true);
    const result = await apiRequest('/app/change-password/', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setDone(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current password"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Current password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
          value={oldPassword}
          onChangeText={setOldPassword}
        />

        <Text style={styles.label}>New password</Text>
        <TextInput
          ref={newPasswordRef}
          style={styles.input}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="New password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          value={newPassword}
          onChangeText={setNewPassword}
        />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        {done ? (
          <Text style={styles.success} accessibilityRole="alert">
            Your password has been changed.
          </Text>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
