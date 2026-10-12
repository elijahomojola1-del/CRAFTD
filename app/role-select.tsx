import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">How will you use CRAFTD?</Text>

      <TouchableOpacity accessibilityRole="button"
        style={styles.card}
        onPress={() => router.push({ pathname: '/register', params: { role: 'client' } })}
      >
        <Text style={styles.cardTitle}>I&apos;m booking a service</Text>
        <Text style={styles.cardSubtitle}>Find and book local pros</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button"
        style={styles.card}
        onPress={() => router.push({ pathname: '/register', params: { role: 'provider' } })}
      >
        <Text style={styles.cardTitle}>I&apos;m offering my services</Text>
        <Text style={styles.cardSubtitle}>Get bookings from customers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: colors.text,
    fontSize: 14,
  },
});