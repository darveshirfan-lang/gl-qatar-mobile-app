import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '../api';
import { isCardMethod, isSupportedMethod } from '../api/payment';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { SectionTitle } from '../components/SectionTitle';
import { config } from '../config';
import { useApp } from '../context/AppContext';
import { colors, formatPrice, spacing } from '../theme';
import type { Address } from '../types';

type Errors = Partial<Record<keyof Address | 'email', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Qatar mobile numbers: 8 digits starting with 3, 5, 6 or 7. */
const QA_MOBILE_RE = /^[3567]\d{7}$/;

function validate(a: Address, email: string | null): Errors {
  const e: Errors = {};
  if (email !== null && !EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
  if (!a.firstname.trim()) e.firstname = 'Required';
  if (!a.lastname.trim()) e.lastname = 'Required';
  if (!/^\d{1,3}$/.test(a.zone.trim())) e.zone = 'Zone number, e.g. 66';
  if (!a.street.trim()) e.street = 'Required';
  if (!a.building.trim()) e.building = 'Required';
  if (!a.city.trim()) e.city = 'Required';
  if (!QA_MOBILE_RE.test(a.mobile.replace(/\s/g, ''))) e.mobile = '8-digit Qatar mobile number';
  return e;
}

function Radio({
  selected,
  title,
  detail,
  onPress,
  disabled,
}: {
  selected: boolean;
  title: string;
  detail?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.text} />
      <Text style={styles.optionTitle}>{title}</Text>
      {detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}
    </Pressable>
  );
}

export default function Checkout() {
  const { cart, customer, isSignedIn, setCart, startNewCart } = useApp();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState(cart?.email ?? '');
  const [address, setAddress] = useState<Address>({
    firstname: customer?.firstname ?? '',
    lastname: customer?.lastname ?? '',
    zone: '',
    street: '',
    building: '',
    city: config.DEFAULT_CITY,
    mobile: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<'address' | 'review'>('address');
  const [busy, setBusy] = useState<string | null>(null);

  if (!cart || !cart.items.length) {
    return <EmptyState title="Your bag is empty" action={{ title: 'Back to shop', onPress: () => router.back() }} />;
  }

  const set = (key: keyof Address) => (value: string) => {
    setAddress((a) => ({ ...a, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Something went wrong', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const submitAddress = () => {
    const found = validate(address, isSignedIn ? null : email);
    setErrors(found);
    if (Object.keys(found).length) return;
    run('address', async () => {
      if (!isSignedIn) await api.setGuestEmail(cart.id, email.trim());
      const updated = await api.setAddress(cart.id, {
        ...address,
        mobile: address.mobile.replace(/\s/g, ''),
      });
      setCart(updated);
      setStep('review');
    });
  };

  const paymentMethods = cart.paymentMethods.filter((m) => isSupportedMethod(m.code));
  const canPlace = !!cart.selectedShipping && !!cart.selectedPayment && isSupportedMethod(cart.selectedPayment);
  const shippingAmount = cart.selectedShipping?.amount ?? 0;

  const placeOrder = () =>
    run('order', async () => {
      const method = cart.selectedPayment!;
      const orderNumber = await api.placeOrder(cart.id);
      // Leave the screen before the bag empties, so it never flashes "empty".
      if (isCardMethod(method)) {
        router.replace({ pathname: '/payment', params: { orderNumber, method } });
      } else {
        router.replace({ pathname: '/order/[number]', params: { number: orderNumber } });
      }
      await startNewCart();
    });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'address' ? (
          <>
            {!isSignedIn && (
              <View style={styles.section}>
                <SectionTitle>Contact</SectionTitle>
                <Field
                  label="Email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Pressable onPress={() => router.push('/login')}>
                  <Text style={styles.link}>Have an account? Sign in</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.section}>
              <SectionTitle>Delivery address</SectionTitle>
              <View style={styles.row}>
                <Field label="First name" value={address.firstname} onChangeText={set('firstname')} error={errors.firstname} autoComplete="given-name" />
                <Field label="Last name" value={address.lastname} onChangeText={set('lastname')} error={errors.lastname} autoComplete="family-name" />
              </View>
              <View style={styles.row}>
                <Field label="Zone" value={address.zone} onChangeText={set('zone')} error={errors.zone} keyboardType="number-pad" maxLength={3} />
                <Field label="Street" value={address.street} onChangeText={set('street')} error={errors.street} />
                <Field label="Building" value={address.building} onChangeText={set('building')} error={errors.building} />
              </View>
              <Field label="City" value={address.city} onChangeText={set('city')} error={errors.city} />
              <Field
                label="Mobile"
                prefix="+974"
                value={address.mobile}
                onChangeText={set('mobile')}
                error={errors.mobile}
                keyboardType="phone-pad"
                maxLength={9}
                autoComplete="tel"
              />
            </View>

            <Button title="Continue" onPress={submitAddress} loading={busy === 'address'} />
          </>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <SectionTitle>Deliver to</SectionTitle>
                <Pressable onPress={() => setStep('address')} hitSlop={8}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
              </View>
              <Text style={styles.addressText}>
                {address.firstname} {address.lastname}
                {'\n'}Building {address.building}, Street {address.street}, Zone {address.zone}
                {'\n'}
                {address.city}, Qatar{'\n'}+974 {address.mobile}
              </Text>
            </View>

            <View style={styles.section}>
              <SectionTitle>Delivery method</SectionTitle>
              {cart.shippingMethods.length ? (
                cart.shippingMethods.map((m) => (
                  <Radio
                    key={`${m.carrierCode}_${m.methodCode}`}
                    title={m.title}
                    detail={m.amount ? formatPrice(m.amount, cart.currency) : 'Free'}
                    selected={
                      cart.selectedShipping?.carrierCode === m.carrierCode &&
                      cart.selectedShipping?.methodCode === m.methodCode
                    }
                    disabled={busy !== null}
                    onPress={() => run('shipping', async () => setCart(await api.setShippingMethod(cart.id, m)))}
                  />
                ))
              ) : (
                <Text style={styles.muted}>No delivery methods are available for this address.</Text>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle>Payment</SectionTitle>
              {paymentMethods.length ? (
                paymentMethods.map((m) => (
                  <Radio
                    key={m.code}
                    title={m.title}
                    detail={isCardMethod(m.code) ? 'Secure page' : undefined}
                    selected={cart.selectedPayment === m.code}
                    disabled={busy !== null}
                    onPress={() => run('payment', async () => setCart(await api.setPaymentMethod(cart.id, m.code)))}
                  />
                ))
              ) : (
                <Text style={styles.muted}>No payment methods are available.</Text>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle>Summary</SectionTitle>
              {cart.items.map((i) => (
                <View key={i.uid} style={styles.line}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {i.quantity} × {i.name}
                    {i.size ? ` (${i.size})` : ''}
                  </Text>
                  <Text>{formatPrice(i.rowTotal, cart.currency)}</Text>
                </View>
              ))}
              <View style={[styles.line, styles.lineTop]}>
                <Text>Subtotal</Text>
                <Text>{formatPrice(cart.subtotal, cart.currency)}</Text>
              </View>
              <View style={styles.line}>
                <Text>Delivery</Text>
                <Text>
                  {cart.selectedShipping ? (shippingAmount ? formatPrice(shippingAmount, cart.currency) : 'Free') : '—'}
                </Text>
              </View>
              <View style={styles.line}>
                <Text style={styles.total}>Total</Text>
                <Text style={styles.total}>{formatPrice(cart.grandTotal, cart.currency)}</Text>
              </View>
            </View>

            <Button
              title={cart.selectedPayment && isCardMethod(cart.selectedPayment) ? 'Continue to payment' : 'Place order'}
              onPress={placeOrder}
              disabled={!canPlace || (busy !== null && busy !== 'order')}
              loading={busy === 'order'}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: spacing.sm },
  link: { fontSize: 14, textDecorationLine: 'underline', color: colors.text },
  muted: { color: colors.muted },
  addressText: { fontSize: 14, lineHeight: 21, color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: -spacing.sm,
  },
  optionSelected: { borderColor: colors.text },
  optionTitle: { flex: 1, fontSize: 14 },
  optionDetail: { fontSize: 14, fontWeight: '600' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  lineName: { flex: 1, color: colors.muted },
  lineTop: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: spacing.md },
  total: { fontSize: 16, fontWeight: '700' },
});
