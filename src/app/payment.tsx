import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { errorMessage } from '../api';
import { getPaymentUrl, type PaymentSession } from '../api/payment';
import { Button } from '../components/Button';
import { colors, spacing } from '../theme';

/**
 * Opens the payment gateway's hosted page for an order that has already been
 * placed, and watches for the gateway's success / failure return URL.
 */
export default function Payment() {
  const { orderNumber, method } = useLocalSearchParams<{ orderNumber: string; method: string }>();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const finished = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    setFailed(false);
    setSession(null);
    finished.current = false;
    try {
      setSession(await getPaymentUrl(orderNumber, method));
      setAttempt((n) => n + 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [orderNumber, method]);

  useEffect(() => {
    start();
  }, [start]);

  const backToShop = () => router.dismissTo('/');

  if (failed || error) {
    return (
      <View style={[styles.screen, styles.failed]}>
        <Text style={styles.title}>Payment not completed</Text>
        <Text style={styles.message}>{error ?? 'The payment was cancelled or declined.'}</Text>
        <Text style={styles.message}>
          Your order #{orderNumber} is saved but not paid. You can try again, or contact us to complete it.
        </Text>
        <View style={styles.actions}>
          <Button title="Try again" onPress={start} />
          <Button title="Back to shop" variant="secondary" onPress={backToShop} />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const handleUrl = (url: string): boolean => {
    if (finished.current) return false;
    if (url.startsWith(session.successUrl)) {
      finished.current = true;
      router.replace({ pathname: '/order/[number]', params: { number: orderNumber, paid: '1' } });
      return false;
    }
    if (url.startsWith(session.failureUrl)) {
      finished.current = true;
      setFailed(true);
      return false;
    }
    return true;
  };

  return (
    <WebView
      key={attempt}
      source={session.source}
      originWhitelist={['*']}
      onShouldStartLoadWithRequest={(req) => handleUrl(req.url)}
      // Android does not call onShouldStartLoadWithRequest for every redirect.
      onNavigationStateChange={(nav) => handleUrl(nav.url)}
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      )}
      style={styles.screen}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  failed: { justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
