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
import { apiRequest } from '../utils/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!email.trim()) {
      setError('Enter the email address you signed up with.');
      return;
    }
    setError('');
    setBusy(true);
    const result = await apiRequest('/app/password-reset/', {
      method: 'POST',
      auth: false,
      body: { email: email.trim() },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep('code');
  };

  const resetPassword = async () => {
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    if (!newPassword) {
      setError('Enter a new password.');
      return;
    }
    setError('');
    setBusy(true);
    const result = await apiRequest('/app/password-reset/confirm/', {
      method: 'POST',
      auth: false,
      body: { email: email.trim(), code: code.trim(), new_password: newPassword },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep('done');
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Reset Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'email' && (
          <>
            <Text style={styles.intro}>
              Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
            </Text>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={sendCode}
              value={email}
              onChangeText={setEmail}
            />
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={styles.intro}>
              If {email.trim()} has an account, a 6-digit code is on its way. It expires in 15 minutes.
              Check your spam folder if you don&apos;t see it.
            </Text>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="6-digit code"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              returnKeyType="next"
              value={code}
              onChangeText={setCode}
            />
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="New password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={resetPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </>
        )}

        {step === 'done' && (
          <Text style={styles.success} accessibilityRole="alert">
            Your password has been reset. You can log in with the new one now.
          </Text>
        )}

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {step === 'done' ? (
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Go to Log In</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={step === 'email' ? sendCode : resetPassword}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{step === 'email' ? 'Send Code' : 'Reset Password'}</Text>
            )}
          </TouchableOpacity>
        )}

        {step === 'code' && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setError('');
              setCode('');
              setStep('email');
            }}
          >
            <Text style={styles.link}>Use a different email or send a new code</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
