import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '../api';
import { EmptyState } from '../components/EmptyState';
import { Loading } from '../components/Loading';
import { useApp } from '../context/AppContext';
import { colors, formatPrice, spacing } from '../theme';
import type { Order } from '../types';

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Orders() {
  const { isSignedIn } = useApp();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await api.getOrders());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  if (!isSignedIn) return <EmptyState title="Sign in to see your orders" />;
  if (error) return <EmptyState title="Couldn't load your orders" message={error} action={{ title: 'Try again', onPress: load }} />;
  if (!orders) return <Loading />;

  return (
    <FlatList
      style={styles.screen}
      data={orders}
      keyExtractor={(o) => o.number}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListEmptyComponent={<EmptyState title="No orders yet" message="Orders you place will appear here." />}
      renderItem={({ item }) => (
        <View style={styles.order}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.number}>#{item.number}</Text>
            <Text style={styles.meta}>{formatDate(item.date)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.total}>{formatPrice(item.total, item.currency)}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  order: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  number: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.muted },
  total: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.muted },
});
