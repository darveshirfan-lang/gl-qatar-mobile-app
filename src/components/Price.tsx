import { StyleSheet, Text, View } from 'react-native';
import { colors, formatPrice } from '../theme';

interface Props {
  price: number;
  regularPrice: number;
  currency: string;
  size?: 'sm' | 'lg';
}

export function Price({ price, regularPrice, currency, size = 'sm' }: Props) {
  const onSale = price < regularPrice;
  const fontSize = size === 'lg' ? 18 : 14;
  return (
    <View style={styles.row}>
      <Text style={[styles.price, { fontSize }, onSale && { color: colors.sale }]}>
        {formatPrice(price, currency)}
      </Text>
      {onSale && (
        <Text style={[styles.was, { fontSize: fontSize - 2 }]}>{formatPrice(regularPrice, currency)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 },
  price: { fontWeight: '600', color: colors.text },
  was: { color: colors.muted, textDecorationLine: 'line-through' },
});
