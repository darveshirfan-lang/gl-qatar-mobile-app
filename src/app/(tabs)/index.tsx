import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '../../api';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { SectionTitle } from '../../components/SectionTitle';
import { colors, spacing } from '../../theme';
import type { Category, ProductSummary } from '../../types';

const HERO_IMAGE = 'https://picsum.photos/seed/gl-doha-hero/1200/1500';

export default function Home() {
  const [arrivals, setArrivals] = useState<ProductSummary[]>([]);
  const [departments, setDepartments] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [a, d] = await Promise.all([api.getNewArrivals(), api.getCategories()]);
      setArrivals(a);
      setDepartments(d);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openCategory = (c: Category) =>
    router.push({ pathname: '/category/[uid]', params: { uid: c.uid, name: c.name } });

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.logo}>GALERIES LAFAYETTE</Text>
        <Text style={styles.logoSub}>DOHA</Text>

        <View style={styles.hero}>
          <Image source={HERO_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.heroShade} />
          <View style={styles.heroText}>
            <Text style={styles.heroKicker}>New season</Text>
            <Text style={styles.heroTitle}>Parisian style,{'\n'}in the heart of Doha</Text>
            <Button title="Shop now" variant="secondary" onPress={() => router.push('/shop')} style={styles.heroButton} />
          </View>
        </View>

        {error ? (
          <EmptyState title="Couldn't load the store" message={error} action={{ title: 'Try again', onPress: load }} />
        ) : (
          <>
            {arrivals.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>Just arrived</SectionTitle>
                <FlatList
                  horizontal
                  data={arrivals}
                  keyExtractor={(p) => p.sku}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.md }}
                  renderItem={({ item }) => <ProductCard product={item} style={{ width: 150 }} />}
                />
              </View>
            )}

            {departments.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>Departments</SectionTitle>
                <View style={styles.tiles}>
                  {departments.map((d) => (
                    <Pressable
                      key={d.uid}
                      accessibilityRole="button"
                      style={styles.tile}
                      onPress={() => openCategory(d)}
                    >
                      {d.image ? (
                        <Image source={d.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : null}
                      <View style={styles.tileShade} />
                      <Text style={styles.tileText}>{d.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  logo: { textAlign: 'center', fontSize: 20, fontWeight: '700', letterSpacing: 3, marginTop: spacing.sm },
  logoSub: { textAlign: 'center', fontSize: 11, letterSpacing: 6, color: colors.muted, marginBottom: spacing.md },
  hero: { height: 460, justifyContent: 'flex-end', backgroundColor: colors.surface },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.25)' },
  heroText: { padding: spacing.lg, gap: spacing.sm },
  heroKicker: { color: '#fff', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '600', lineHeight: 36 },
  heroButton: { borderColor: '#fff', marginTop: spacing.sm, alignSelf: 'flex-start' },
  section: { paddingLeft: spacing.md, marginTop: spacing.xl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingRight: spacing.md, paddingBottom: spacing.xl },
  tile: {
    width: '48.5%',
    aspectRatio: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tileShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.2)' },
  tileText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
