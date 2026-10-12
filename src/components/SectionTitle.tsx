import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
