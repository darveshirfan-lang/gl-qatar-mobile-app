import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { errorMessage } from '../api';
import { colors, spacing } from '../theme';
import type { ProductPage, ProductSummary } from '../types';
import { EmptyState } from './EmptyState';
import { ProductCard } from './ProductCard';

interface Props {
  /** Loads one page (1-based). Change `loadKey` to reload from page 1. */
  loadPage: (page: number) => Promise<ProductPage>;
  loadKey: string;
  header?: ReactElement | null;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function ProductGrid({ loadPage, loadKey, header, emptyTitle = 'No products', emptyMessage }: Props) {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const loadRef = useRef(loadPage);
  loadRef.current = loadPage;

  const load = useCallback(async (nextPage: number, mode: 'more' | 'reset' | 'refresh') => {
    const id = ++request.current;
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await loadRef.current(nextPage);
      if (id !== request.current) return;
      setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setPage(nextPage);
      setTotalPages(res.totalPages);
    } catch (e) {
      if (id === request.current) setError(errorMessage(e));
    } finally {
      if (id === request.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(0);
    load(1, 'reset');
  }, [loadKey, load]);

  const onEndReached = () => {
    if (!loading && !error && page > 0 && page < totalPages) load(page + 1, 'more');
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.sku}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <ProductCard product={item} style={styles.cell} />}
      ListHeaderComponent={header}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, 'refresh')} />}
      ListEmptyComponent={
        loading ? null : error ? (
          <EmptyState title="Couldn't load products" message={error} action={{ title: 'Try again', onPress: () => load(1, 'reset') }} />
        ) : page > 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : null
      }
      ListFooterComponent={
        loading ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.text} />
          </View>
        ) : error && items.length ? (
          <EmptyState title="Couldn't load more" message={error} action={{ title: 'Try again', onPress: () => load(page + 1, 'more') }} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  row: { gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  cell: { flex: 1, maxWidth: '50%' },
  footer: { padding: spacing.lg },
});
