import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api';
import type { Cart, Customer, RegisterInput } from '../types';

const TOKEN_KEY = 'gl.token';
const GUEST_CART_KEY = 'gl.guestCartId';

interface AppState {
  ready: boolean;
  cart: Cart | null;
  customer: Customer | null;
  isSignedIn: boolean;
  bagCount: number;
  /** Returns the current cart id, creating a cart if needed. */
  ensureCart(): Promise<string>;
  addToBag(sku: string, sizeUid?: string): Promise<void>;
  updateQuantity(itemUid: string, quantity: number): Promise<void>;
  removeItem(itemUid: string): Promise<void>;
  refreshCart(): Promise<void>;
  setCart(cart: Cart): void;
  /** Call after an order is placed: the old cart is closed. */
  startNewCart(): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  signOut(): Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

async function store(key: string, value: string | null) {
  try {
    if (value) await AsyncStorage.setItem(key, value);
    else await AsyncStorage.removeItem(key);
  } catch {
    // Storage failures only cost persistence across restarts.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCartState] = useState<Cart | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const cartId = useRef<string | null>(null);

  const setCart = useCallback((c: Cart) => {
    cartId.current = c.id;
    setCartState(c);
  }, []);

  const loadCustomerSession = useCallback(async () => {
    const [profile, id] = await Promise.all([api.getCustomer(), api.getCustomerCartId()]);
    setCustomer(profile);
    cartId.current = id;
    setCartState(await api.getCart(id));
  }, []);

  // Restore the session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedCart] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY).catch(() => null),
          AsyncStorage.getItem(GUEST_CART_KEY).catch(() => null),
        ]);
        if (savedToken) {
          api.setToken(savedToken);
          try {
            await loadCustomerSession();
            setToken(savedToken);
            return;
          } catch {
            // Token expired: continue as a guest.
            api.setToken(null);
            await store(TOKEN_KEY, null);
          }
        }
        if (savedCart) {
          try {
            setCart(await api.getCart(savedCart));
          } catch {
            await store(GUEST_CART_KEY, null);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, [loadCustomerSession, setCart]);

  const ensureCart = useCallback(async () => {
    if (cartId.current) return cartId.current;
    const id = token ? await api.getCustomerCartId() : await api.createCart();
    if (!token) await store(GUEST_CART_KEY, id);
    cartId.current = id;
    return id;
  }, [token]);

  const withFreshCart = useCallback(
    async (fn: (id: string) => Promise<Cart>) => {
      const id = await ensureCart();
      try {
        setCart(await fn(id));
      } catch (e) {
        // The cart may have been closed elsewhere (e.g. order placed on the website).
        const message = String((e as Error)?.message);
        if (/cart/i.test(message) && /active|find|exist/i.test(message)) {
          cartId.current = null;
          await store(GUEST_CART_KEY, null);
          setCart(await fn(await ensureCart()));
        } else {
          throw e;
        }
      }
    },
    [ensureCart, setCart],
  );

  const addToBag = useCallback(
    (sku: string, sizeUid?: string) => withFreshCart((id) => api.addToCart(id, sku, 1, sizeUid)),
    [withFreshCart],
  );

  const updateQuantity = useCallback(
    async (itemUid: string, quantity: number) => {
      const id = await ensureCart();
      setCart(await api.updateCartItem(id, itemUid, quantity));
    },
    [ensureCart, setCart],
  );

  const removeItem = useCallback(
    async (itemUid: string) => {
      const id = await ensureCart();
      setCart(await api.removeCartItem(id, itemUid));
    },
    [ensureCart, setCart],
  );

  const refreshCart = useCallback(async () => {
    if (!cartId.current) return;
    try {
      setCart(await api.getCart(cartId.current));
    } catch {
      cartId.current = null;
      setCartState(null);
      await store(GUEST_CART_KEY, null);
    }
  }, [setCart]);

  const startNewCart = useCallback(async () => {
    cartId.current = null;
    setCartState(null);
    await store(GUEST_CART_KEY, null);
    if (token) {
      try {
        setCart(await api.getCart(await api.getCustomerCartId()));
      } catch {
        // The account cart will be fetched on the next add.
      }
    }
  }, [token, setCart]);

  const afterAuth = useCallback(
    async (newToken: string) => {
      const guestCartId = token ? null : cartId.current;
      api.setToken(newToken);
      await store(TOKEN_KEY, newToken);
      setToken(newToken);
      await loadCustomerSession();
      // Move the guest bag into the account bag.
      if (guestCartId && cartId.current && guestCartId !== cartId.current) {
        try {
          setCart(await api.mergeCarts(guestCartId, cartId.current));
        } catch {
          // Guest cart was empty or already closed.
        }
      }
      await store(GUEST_CART_KEY, null);
    },
    [token, loadCustomerSession, setCart],
  );

  const signIn = useCallback(
    async (email: string, password: string) => afterAuth(await api.signIn(email, password)),
    [afterAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => afterAuth(await api.register(input)),
    [afterAuth],
  );

  const signOut = useCallback(async () => {
    await api.signOut();
    api.setToken(null);
    await store(TOKEN_KEY, null);
    setToken(null);
    setCustomer(null);
    cartId.current = null;
    setCartState(null);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      cart,
      customer,
      isSignedIn: !!token,
      bagCount: cart?.totalQuantity ?? 0,
      ensureCart,
      addToBag,
      updateQuantity,
      removeItem,
      refreshCart,
      setCart,
      startNewCart,
      signIn,
      register,
      signOut,
    }),
    [
      ready,
      cart,
      customer,
      token,
      ensureCart,
      addToBag,
      updateQuantity,
      removeItem,
      refreshCart,
      setCart,
      startNewCart,
      signIn,
      register,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
