import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// YYYY-MM-DD in the phone's own time zone.
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

interface DateStripProps {
  // Selected day as YYYY-MM-DD, or null when nothing is picked yet.
  value: string | null;
  onChange: (dateKey: string) => void;
  days?: number;
}

// A sideways-scrolling row of upcoming days to tap, starting from today.
export default function DateStrip({ value, onChange, days = 60 }: DateStripProps) {
  const options = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, offset) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      return {
        key: toDateKey(date),
        weekday: offset === 0 ? 'Today' : WEEKDAYS[date.getDay()],
        day: date.getDate(),
        month: MONTHS[date.getMonth()],
        spoken: date.toDateString(),
      };
    });
  }, [days]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.spoken}
            style={[styles.day, selected && styles.daySelected]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.weekday, selected && styles.textSelected]}>{option.weekday}</Text>
            <Text style={[styles.dayNumber, selected && styles.textSelected]}>{option.day}</Text>
            <Text style={[styles.month, selected && styles.textSelected]}>{option.month}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  day: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  daySelected: { backgroundColor: colors.primary },
  weekday: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  dayNumber: { fontSize: 20, color: colors.text, fontWeight: '700', marginVertical: 2 },
  month: { fontSize: 12, color: colors.textMuted },
  textSelected: { color: colors.onPrimary },
});
