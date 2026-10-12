import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Badge({ label, tone }: { label: string; tone: 'sale' | 'soldout' }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone === 'sale' ? colors.sale : colors.text }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

/** Badges for a product: discount % or sold out. */
export function productBadge(p: { price: number; regularPrice: number; inStock: boolean }) {
  if (!p.inStock) return <Badge label="Sold out" tone="soldout" />;
  if (p.price < p.regularPrice) {
    const pct = Math.round((1 - p.price / p.regularPrice) * 100);
    return <Badge label={`Sale -${pct}%`} tone="sale" />;
  }
  return null;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3 },
  text: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});
