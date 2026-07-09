import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
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
      <Text style={styles.logo}>CRAFTD</Text>
      <Text style={styles.tagline}>Book trusted pros. Anytime, anywhere.</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/register')}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.loginText}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#FAF7F2',
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  loginText: {
    color: '#FAF7F2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});