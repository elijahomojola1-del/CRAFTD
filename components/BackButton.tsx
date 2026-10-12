import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/theme';

// The one back button used by every screen.
export default function BackButton({ color = colors.primary }: { color?: string }) {
  const router = useRouter();

  const goBack = () => {
    // A page opened directly in the browser has nothing to go back to.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.button}
      onPress={goBack}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[styles.text, { color }]}>{'< Back'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  text: { fontSize: 15, fontWeight: '600' },
});
