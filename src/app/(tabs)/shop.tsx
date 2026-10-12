import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '../../api';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { colors, spacing } from '../../theme';
import type { Category } from '../../types';

const open = (c: Category, title = c.name) =>
  router.push({ pathname: '/category/[uid]', params: { uid: c.uid, name: title } });

export default function Shop() {
  const [departments, setDepartments] = useState<Category[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDepartments(await api.getCategories());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Couldn't load categories" message={error} action={{ title: 'Try again', onPress: load }} />;
  if (!departments) return <Loading />;

  return (
    <ScrollView style={styles.screen}>
      {departments.map((d) => {
        const isOpen = expanded === d.uid;
        const hasChildren = d.children.length > 0;
        return (
          <View key={d.uid} style={styles.group}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={styles.row}
              onPress={() => (hasChildren ? setExpanded(isOpen ? null : d.uid) : open(d))}
            >
              <Text style={styles.department}>{d.name}</Text>
              <Ionicons
                name={hasChildren ? (isOpen ? 'chevron-up' : 'chevron-down') : 'chevron-forward'}
                size={18}
                color={colors.text}
              />
            </Pressable>
            {isOpen && (
              <View style={styles.children}>
                <Pressable style={styles.childRow} onPress={() => open(d)}>
                  <Text style={[styles.child, { fontWeight: '600' }]}>Shop all {d.name}</Text>
                </Pressable>
                {d.children.map((c) => (
                  <Pressable key={c.uid} style={styles.childRow} onPress={() => open(c, `${d.name} · ${c.name}`)}>
                    <Text style={styles.child}>{c.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  group: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingVertical: 20 },
  department: { fontSize: 16, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  children: { paddingBottom: spacing.sm },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  child: { fontSize: 15, color: colors.text },
});
