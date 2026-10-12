import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../constants/theme';
import { apiRequest } from '../utils/api';

export default function RegisterScreen() {
  const router = useRouter();
  // Set on the "How will you use CRAFTD?" screen; providers is the default.
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Enter your name, your email address and a password.');
      return;
    }
    if (!agreed) {
      setErrorMessage('Please agree to the Terms & Privacy Policy to continue.');
      return;
    }
    setErrorMessage('');
    setSubmitting(true);

    const address = email.trim().toLowerCase();
    const result = await apiRequest('/app/register/', {
      method: 'POST',
      auth: false,
      body: {
        username: address,
        email: address,
        password,
        display_name: name.trim(),
        role: role === 'client' ? 'client' : 'provider',
      },
      fallbackError: 'Registration failed. Check your details and try again.',
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title} accessibilityRole="header">Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name or business name"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Your name or business name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={80}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        ref={emailRef}
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        ref={passwordRef}
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.consentRow}>
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I agree to the Terms and Privacy Policy"
          style={[styles.checkbox, agreed && styles.checkboxChecked]}
          onPress={() => setAgreed((prev) => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {agreed ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} /> : null}
        </TouchableOpacity>
        <Text style={styles.consentText}>
          I agree to the{' '}
          <Text
            accessibilityRole="link"
            style={styles.termsLink}
            onPress={() => router.push('/terms')}
          >
            Terms & Privacy Policy
          </Text>
        </Text>
      </View>

      {errorMessage ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.6 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  consentText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  link: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});