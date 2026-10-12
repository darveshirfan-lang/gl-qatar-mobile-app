import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { colors, spacing } from '../../theme';

export default function OrderPlaced() {
  const { number, paid } = useLocalSearchParams<{ number: string; paid?: string }>();
  const { isSignedIn } = useApp();

  return (
    <View style={styles.screen}>
      <Ionicons name="checkmark-circle-outline" size={72} color={colors.success} />
      <Text style={styles.title}>Thank you for your order</Text>
      <Text style={styles.number}>Order #{number}</Text>
      <Text style={styles.message}>
        {paid
          ? 'Your payment was successful. '
          : 'Please have the payment ready when your order arrives. '}
        We'll call you on your mobile number to confirm delivery.
      </Text>
      <View style={styles.actions}>
        {isSignedIn && (
          <Button title="View my orders" variant="secondary" onPress={() => router.replace('/orders')} />
        )}
        <Button title="Continue shopping" onPress={() => router.dismissTo('/')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  number: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  message: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
