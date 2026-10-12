import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { api } from '../../api';
import { EmptyState } from '../../components/EmptyState';
import { ProductGrid } from '../../components/ProductGrid';
import { colors, spacing } from '../../theme';

export default function Search() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  // Search shortly after the user stops typing.
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const loadPage = useCallback((page: number) => api.searchProducts(query, page), [query]);

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => setQuery(text.trim())}
          placeholder="Search brands, products…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Search"
        />
        {text ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {query.length >= 2 ? (
        <ProductGrid
          loadKey={query}
          loadPage={loadPage}
          emptyTitle="No results"
          emptyMessage={`We couldn't find anything for "${query}".`}
        />
      ) : (
        <EmptyState title="What are you looking for?" message="Search by brand, product or category." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },
});
