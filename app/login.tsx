import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotifications';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      console.log('Login button pressed');

      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('Login failed:', data);
        return;
      }

      console.log('Login success:', data);

      await SecureStore.setItemAsync('accessToken', data.access);

      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await fetch(`${API_BASE_URL}/app/save-push-token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.access}`,
            },
            body: JSON.stringify({ push_token: pushToken }),
          });
        }
      } catch (pushError) {
        console.log('Push registration failed:', pushError);
      }

      router.replace('/home');
    } catch (error) {
      console.log('Network error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.logo}>CRAFTD</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Password field with show/hide toggle */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.registerText}>
          Don't have an account? <Text style={styles.registerLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FAF7F2',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FAF7F2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    marginBottom: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    color: '#FAF7F2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  eyeButton: {
    padding: 4,
  },
  eyeText: {
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 16,
  },
  registerText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
  },
  registerLink: {
    color: '#F5A623',
    fontWeight: '600',
  },
});