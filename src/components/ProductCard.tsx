import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import type { ProductSummary } from '../types';
import { productBadge } from './Badge';
import { Price } from './Price';

export function ProductCard({ product, style }: { product: ProductSummary; style?: ViewStyle }) {
  const badge = productBadge(product);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.brand ?? ''} ${product.name}`.trim()}
      style={[styles.card, style]}
      onPress={() => router.push({ pathname: '/product/[sku]', params: { sku: product.sku } })}
    >
      <View>
        <Image
          source={product.image || undefined}
          style={[styles.image, !product.inStock && { opacity: 0.5 }]}
          contentFit="cover"
          transition={150}
        />
        {badge && <View style={styles.badge}>{badge}</View>}
      </View>
      {product.brand ? <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text> : null}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Price price={product.price} regularPrice={product.regularPrice} currency={product.currency} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  badge: { position: 'absolute', top: 8, left: 8 },
  brand: { marginTop: 6, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text },
  name: { fontSize: 13, color: colors.muted },
});
