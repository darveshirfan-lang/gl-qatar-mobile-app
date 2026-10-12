import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, spacing } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  /** Fixed text shown before the input, e.g. "+974". */
  prefix?: string;
}

export function Field({ label, error, prefix, style, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, !!error && { borderColor: colors.sale }]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={colors.disabled}
          style={[styles.input, style]}
          accessibilityLabel={label}
          {...input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  prefix: { fontSize: 16, color: colors.muted, marginRight: spacing.sm },
  input: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },
  error: { fontSize: 12, color: colors.sale },
});
