import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton';
import { colors } from '../constants/theme';

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
  const [query, setQuery] = useState('');

  const runSearch = () => {
    if (!query.trim()) return;
    router.push(`/gigs?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Browse Categories</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search all services, e.g. tailor"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search all services"
          returnKeyType="search"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
        />
        <TouchableOpacity accessibilityRole="button" style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={cat.slug}
            style={styles.tile}
            onPress={() => router.push(`/gigs?category=${encodeURIComponent(cat.slug)}`)}
          >
            <Text style={styles.tileIcon} aria-hidden>{cat.icon}</Text>
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
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tile: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  tileIcon: { fontSize: 28, marginBottom: 10 },
  tileText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
