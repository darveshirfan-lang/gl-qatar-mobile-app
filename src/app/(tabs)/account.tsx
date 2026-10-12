import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { config } from '../../config';
import { useApp } from '../../context/AppContext';
import { colors, spacing } from '../../theme';

function Row({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.rowText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Account() {
  const { customer, isSignedIn, signOut } = useApp();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {isSignedIn && customer ? (
        <>
          <Text style={styles.hello}>Hello, {customer.firstname}</Text>
          <Text style={styles.email}>{customer.email}</Text>
          <View style={styles.list}>
            <Row icon="receipt-outline" title="My orders" onPress={() => router.push('/orders')} />
          </View>
          <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
        </>
      ) : (
        <>
          <Text style={styles.hello}>My account</Text>
          <Text style={styles.email}>
            Sign in with your galerieslafayette.qa account to see your orders. Your bag comes with you.
          </Text>
          <View style={styles.buttons}>
            <Button title="Sign in" onPress={() => router.push('/login')} />
            <Button title="Create account" variant="secondary" onPress={() => router.push('/register')} />
          </View>
          {config.USE_MOCK && (
            <Text style={styles.demo}>Demo account: demo@galerieslafayette.qa / demo1234</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  hello: { fontSize: 24, fontWeight: '600', marginTop: spacing.md },
  email: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  list: { marginVertical: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowText: { flex: 1, fontSize: 15 },
  buttons: { gap: spacing.sm, marginTop: spacing.lg },
  demo: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
});
