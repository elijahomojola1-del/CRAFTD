import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';
import { getToken } from '../utils/tokenStorage';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await getToken();
      if (token) {
        router.replace('/home');
      } else {
        setIsChecking(false);
      }
    };
    checkLoggedIn();
  }, []);

  if (isChecking) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo} accessibilityRole="header">CRAFTD</Text>
      <Text style={styles.tagline}>Find and book skilled pros near you.</Text>

      <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push('/role-select')}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/login')}>
        <Text style={styles.loginText}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  loginText: {
    color: colors.text,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});