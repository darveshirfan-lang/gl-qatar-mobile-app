import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { useApp } from '../context/AppContext';
import { colors, spacing } from '../theme';

export default function Register() {
  const { register } = useApp();
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.firstname.trim() || !form.lastname.trim()) return setError('Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    // Magento's default rule: 8+ characters with at least 3 of lower, upper, digit, symbol.
    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((r) => r.test(form.password)).length;
    if (form.password.length < 8 || classes < 3) {
      return setError('Password needs 8+ characters and three of: lowercase, uppercase, number, symbol.');
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Your account works on the app and on galerieslafayette.qa.</Text>
        <View style={styles.row}>
          <Field label="First name" value={form.firstname} onChangeText={set('firstname')} autoComplete="given-name" />
          <Field label="Last name" value={form.lastname} onChangeText={set('lastname')} autoComplete="family-name" />
        </View>
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: spacing.sm }} />
        <Pressable onPress={() => router.replace('/login')} style={styles.switch}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  intro: { fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', gap: spacing.sm },
  error: { color: colors.sale, fontSize: 14 },
  switch: { alignItems: 'center', padding: spacing.md },
  link: { textDecorationLine: 'underline', fontSize: 14 },
});
