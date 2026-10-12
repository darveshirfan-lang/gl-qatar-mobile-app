import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { ProductGrid } from '../../components/ProductGrid';
import { colors, spacing } from '../../theme';
import type { Category } from '../../types';

function find(list: Category[], uid: string): Category | undefined {
  for (const c of list) {
    if (c.uid === uid) return c;
    const hit = find(c.children, uid);
    if (hit) return hit;
  }
  return undefined;
}

export default function CategoryScreen() {
  const { uid, name } = useLocalSearchParams<{ uid: string; name?: string }>();
  const [category, setCategory] = useState<Category | undefined>();

  useEffect(() => {
    api.getCategories().then((all) => setCategory(find(all, uid))).catch(() => {});
  }, [uid]);

  const loadPage = useCallback((page: number) => api.getCategoryProducts(uid, page), [uid]);
  const subcategories = category?.children ?? [];

  return (
    <>
      <Stack.Screen options={{ title: name ?? category?.name ?? '' }} />
      <ProductGrid
        loadKey={uid}
        loadPage={loadPage}
        emptyTitle="Nothing here yet"
        emptyMessage="New pieces arrive every week. Check back soon."
        header={
          subcategories.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {subcategories.map((c) => (
                <Pressable
                  key={c.uid}
                  accessibilityRole="button"
                  style={styles.chip}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[uid]',
                      params: { uid: c.uid, name: `${category?.name ?? name ?? ''} · ${c.name}` },
                    })
                  }
                >
                  <Text style={styles.chipText}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={{ height: spacing.md }} />
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, padding: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
});
