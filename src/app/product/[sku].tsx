import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '../../api';
import { productBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Price } from '../../components/Price';
import { useApp } from '../../context/AppContext';
import { colors, spacing } from '../../theme';
import type { Product } from '../../types';

export default function ProductScreen() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { addToBag } = useApp();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [sizeUid, setSizeUid] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await api.getProduct(sku);
      setProduct(p);
      // Preselect the only available size (e.g. one-size items).
      const available = p?.sizes.filter((s) => s.inStock) ?? [];
      if (available.length === 1 && p?.sizes.length === 1) setSizeUid(available[0].uid);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [sku]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Couldn't load this product" message={error} action={{ title: 'Try again', onPress: load }} />;
  if (product === undefined) return <Loading />;
  if (product === null) return <EmptyState title="Product not found" message="It may no longer be available." />;

  const needsSize = product.sizes.length > 0;
  const canAdd = product.inStock && (!needsSize || !!sizeUid);
  const badge = productBadge(product);

  const onAdd = async () => {
    setAdding(true);
    try {
      await addToBag(product.sku, sizeUid);
      setAdded(true);
    } catch (e) {
      Alert.alert("Couldn't add to bag", errorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const buttonTitle = !product.inStock
    ? 'Sold out'
    : needsSize && !sizeUid
      ? 'Select a size'
      : 'Add to bag';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <FlatList
          horizontal
          pagingEnabled
          data={product.images}
          keyExtractor={(u, i) => `${i}-${u}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={item} style={{ width, height: width * (4 / 3), backgroundColor: colors.surface }} contentFit="cover" />
          )}
        />
        {product.images.length > 1 && (
          <View style={styles.dots}>
            {product.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {badge}
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          <Text style={styles.name}>{product.name}</Text>
          <Price price={product.price} regularPrice={product.regularPrice} currency={product.currency} size="lg" />

          {needsSize && (
            <View style={styles.sizes}>
              <Text style={styles.label}>Size</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((s) => {
                  const selected = s.uid === sizeUid;
                  return (
                    <Pressable
                      key={s.uid}
                      disabled={!s.inStock}
                      accessibilityRole="button"
                      accessibilityLabel={`Size ${s.label}${s.inStock ? '' : ', sold out'}`}
                      accessibilityState={{ selected, disabled: !s.inStock }}
                      onPress={() => {
                        setSizeUid(s.uid);
                        setAdded(false);
                      }}
                      style={[styles.size, selected && styles.sizeSelected, !s.inStock && styles.sizeDisabled]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selected && { color: colors.onPrimary },
                          !s.inStock && styles.sizeTextDisabled,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {product.description ? (
            <View style={styles.description}>
              <Text style={styles.label}>Details</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        {added ? (
          <View style={styles.addedRow}>
            <Button title="Keep shopping" variant="secondary" onPress={() => setAdded(false)} style={{ flex: 1 }} />
            <Button title="View bag" onPress={() => router.push('/bag')} style={{ flex: 1 }} />
          </View>
        ) : (
          <Button title={buttonTitle} onPress={onAdd} disabled={!canAdd} loading={adding} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.text },
  body: { padding: spacing.md, gap: spacing.sm },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.sm },
  name: { fontSize: 20, color: colors.text },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  sizes: { marginTop: spacing.lg },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  size: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSelected: { backgroundColor: colors.text },
  sizeDisabled: { borderColor: colors.border, backgroundColor: colors.surface },
  sizeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  sizeTextDisabled: { color: colors.disabled, textDecorationLine: 'line-through' },
  description: { marginTop: spacing.lg },
  descriptionText: { fontSize: 14, lineHeight: 22, color: colors.muted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  addedRow: { flexDirection: 'row', gap: spacing.sm },
});
