import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How will you use CRAFTD?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/register', params: { role: 'customer' } })}
      >
        <Text style={styles.cardTitle}>I'm booking a service</Text>
        <Text style={styles.cardSubtitle}>Find and book trusted pros</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/register', params: { role: 'provider' } })}
      >
        <Text style={styles.cardTitle}>I'm offering my services</Text>
        <Text style={styles.cardSubtitle}>Get bookings from customers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAF7F2',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#2A2A2D',
    borderWidth: 1.5,
    borderColor: '#F5A623',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#F5A623',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#FAF7F2',
    fontSize: 14,
  },
});