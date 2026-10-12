import { StyleSheet } from 'react-native';
import { colors } from './theme';

// Shared layout for the simple form and list screens (settings sub-pages,
// password screens), so they all look the same.
export const formStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSpacer: { width: 50 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  dangerButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerButtonText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 20, fontSize: 14 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 16 },
  success: { color: colors.success, fontSize: 14, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
