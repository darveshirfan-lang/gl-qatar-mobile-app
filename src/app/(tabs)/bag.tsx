import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../../api';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { QuantityStepper } from '../../components/QuantityStepper';
import { useApp } from '../../context/AppContext';
import { colors, formatPrice, spacing } from '../../theme';
import type { CartItem } from '../../types';

export default function Bag() {
  const { cart, updateQuantity, removeItem, refreshCart } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshCart();
    }, [refreshCart]),
  );

  const run = async (itemUid: string, fn: () => Promise<void>) => {
    setBusy(itemUid);
    try {
      await fn();
    } catch (e) {
      Alert.alert("Couldn't update your bag", errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const items = cart?.items ?? [];
  if (!items.length) {
    return (
      <EmptyState
        title="Your bag is empty"
        message="Discover new arrivals from our Doha store."
        action={{ title: 'Start shopping', onPress: () => router.push('/shop') }}
      />
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.item, busy === item.uid && { opacity: 0.5 }]}>
      <Image source={item.image || undefined} style={styles.image} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.size ? <Text style={styles.meta}>Size: {item.size}</Text> : null}
        <Text style={styles.meta}>{formatPrice(item.price, cart!.currency)}</Text>
        <View style={styles.actions}>
          <QuantityStepper
            value={item.quantity}
            disabled={busy !== null}
            onChange={(q) => run(item.uid, () => updateQuantity(item.uid, q))}
          />
          <Text style={styles.rowTotal}>{formatPrice(item.rowTotal, cart!.currency)}</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={`Remove ${item.name}`}
        hitSlop={10}
        disabled={busy !== null}
        onPress={() => run(item.uid, () => removeItem(item.uid))}
      >
        <Ionicons name="close" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.uid}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ padding: spacing.md }}
      />
      <View style={styles.summary}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal ({cart!.totalQuantity} {cart!.totalQuantity === 1 ? 'item' : 'items'})</Text>
          <Text style={styles.total}>{formatPrice(cart!.subtotal, cart!.currency)}</Text>
        </View>
        <Text style={styles.note}>Delivery is calculated at checkout.</Text>
        <Button title="Checkout" onPress={() => router.push('/checkout')} disabled={busy !== null} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  image: { width: 90, height: 120, backgroundColor: colors.surface },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  rowTotal: { fontSize: 14, fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  summary: { padding: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: colors.text },
  total: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
});
