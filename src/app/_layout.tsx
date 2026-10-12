import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from '../components/Loading';
import { AppProvider, useApp } from '../context/AppContext';
import { colors } from '../theme';

function RootStack() {
  const { ready } = useApp();
  if (!ready) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[uid]" options={{ title: '' }} />
      <Stack.Screen name="product/[sku]" options={{ title: '' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="payment" options={{ title: 'Secure payment', gestureEnabled: false }} />
      <Stack.Screen name="order/[number]" options={{ title: 'Order placed', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="orders" options={{ title: 'My orders' }} />
      <Stack.Screen name="login" options={{ title: 'Sign in', presentation: 'modal' }} />
      <Stack.Screen name="register" options={{ title: 'Create account', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}
