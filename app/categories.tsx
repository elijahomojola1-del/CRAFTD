import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { name: 'Design', slug: 'design', icon: '🎨' },
  { name: 'Development', slug: 'development', icon: '💻' },
  { name: 'Writing', slug: 'writing', icon: '✍️' },
  { name: 'Tutoring', slug: 'tutoring', icon: '📚' },
  { name: 'Marketing', slug: 'marketing', icon: '📢' },
  { name: 'Business Support', slug: 'business_support', icon: '💼' },
  { name: 'Home Repairs', slug: 'home_repairs', icon: '🔧' },
  { name: 'Cleaning', slug: 'cleaning', icon: '🧹' },
  { name: 'Construction', slug: 'construction', icon: '🏗️' },
  { name: 'Automotive', slug: 'automotive', icon: '🚗' },
  { name: 'Beauty & Fashion', slug: 'beauty_fashion', icon: '✂️' },
  { name: 'Events', slug: 'events', icon: '🎉' },
  { name: 'Transport & Errands', slug: 'transport_errands', icon: '🚚' },
  { name: 'Health & Fitness', slug: 'health_fitness', icon: '💪' },
];

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Browse Categories</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={styles.tile}
            onPress={() => router.push(`/gigss?category=${encodeURIComponent(cat.slug)}`)}
          >
            <Text style={styles.tileIcon}>{cat.icon}</Text>
            <Text style={styles.tileText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141416' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: { color: '#F5A623', fontSize: 15, marginRight: 16, fontWeight: '500' },
  title: { color: '#FAF7F2', fontSize: 20, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tile: {
    width: '48%',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  tileIcon: { fontSize: 28, marginBottom: 10 },
  tileText: { color: '#FAF7F2', fontSize: 14, fontWeight: '600' },
});