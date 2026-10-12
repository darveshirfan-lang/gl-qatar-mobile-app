import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Button } from './Button';

interface Props {
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void };
}

export function EmptyState({ title, message, action }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <Button title={action.title} onPress={action.onPress} variant="secondary" style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
});
