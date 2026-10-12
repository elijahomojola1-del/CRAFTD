import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton';
import { formStyles } from '../constants/formStyles';
import { colors } from '../constants/theme';
import { apiRequest } from '../utils/api';

interface BlockedUser {
  id: number;
  blocked: number;
  blocked_username: string;
}

export default function BlockedUsersScreen() {
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const fetchBlocks = useCallback(async () => {
    const result = await apiRequest<BlockedUser[]>('/app/blocks/', {
      fallbackError: 'Could not load your blocked list.',
    });
    setError(result.ok ? '' : result.error);
    if (result.ok && result.data) setBlocks(result.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlocks();
    }, [fetchBlocks])
  );

  const unblock = async (userId: number) => {
    setUnblockingId(userId);
    const result = await apiRequest(`/app/blocks/${userId}/`, {
      method: 'DELETE',
      fallbackError: 'Could not unblock this person.',
    });
    setUnblockingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBlocks((current) => current.filter((block) => block.blocked !== userId));
  };

  return (
    <View style={formStyles.safe}>
      <View style={formStyles.header}>
        <BackButton />
        <Text style={formStyles.title} accessibilityRole="header">Blocked Users</Text>
        <View style={formStyles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={formStyles.content}
          ListHeaderComponent={
            error ? (
              <Text style={formStyles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            error ? null : (
              <Text style={formStyles.empty}>
                You haven&apos;t blocked anyone. You can block someone from their profile.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.blocked_username}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Unblock ${item.blocked_username}`}
                style={styles.unblockButton}
                onPress={() => unblock(item.blocked)}
                disabled={unblockingId === item.blocked}
              >
                {unblockingId === item.blocked ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.unblockText}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  name: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  unblockButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 86,
    alignItems: 'center',
  },
  unblockText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
