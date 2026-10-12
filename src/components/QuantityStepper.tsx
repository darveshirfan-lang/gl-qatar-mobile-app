import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
}

export function QuantityStepper({ value, onChange, disabled, max = 10 }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Decrease quantity"
        disabled={disabled || value <= 1}
        onPress={() => onChange(value - 1)}
        style={styles.btn}
        hitSlop={6}
      >
        <Ionicons name="remove" size={16} color={value <= 1 || disabled ? colors.disabled : colors.text} />
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`Quantity ${value}`}>{value}</Text>
      <Pressable
        accessibilityLabel="Increase quantity"
        disabled={disabled || value >= max}
        onPress={() => onChange(value + 1)}
        style={styles.btn}
        hitSlop={6}
      >
        <Ionicons name="add" size={16} color={value >= max || disabled ? colors.disabled : colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  btn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
