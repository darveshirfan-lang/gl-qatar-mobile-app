import { config } from '../config';
import type {
  Address,
  Cart,
  Category,
  Customer,
  Order,
  Product,
  ProductPage,
  ProductSummary,
  RegisterInput,
  ShippingMethod,
  ShopApi,
} from '../types';

let authToken: string | null = null;

export class ApiError extends Error {}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Store: config.STORE_CODE,
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${config.MAGENTO_URL}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new ApiError('Could not reach the store. Check your connection and try again.');
  }

  let json: { data?: T; errors?: { message: string }[] };
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`The store returned an unexpected response (HTTP ${res.status}).`);
  }
  if (json.errors?.length) throw new ApiError(json.errors[0].message);
  if (!json.data) throw new ApiError(`The store returned no data (HTTP ${res.status}).`);
  return json.data;
}

/* ---------- fragments and mappers ---------- */

const PRODUCT_SUMMARY = `
  sku
  name
  stock_status
  small_image { url }
  price_range {
    minimum_price {
      regular_price { value currency }
      final_price { value currency }
    }
  }
`;

interface RawMoney {
  value: number;
  currency: string;
}

interface RawProduct {
  sku: string;
  name: string;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
  small_image?: { url: string } | null;
  price_range: { minimum_price: { regular_price: RawMoney; final_price: RawMoney } };
}

interface RawProductDetail extends RawProduct {
  description?: { html: string } | null;
  media_gallery?: { url: string; position?: number; disabled?: boolean }[];
  configurable_options?: {
    attribute_code: string;
    label: string;
    values: { uid: string; label: string }[];
  }[];
  variants?: {
    attributes: { uid: string }[];
    product: { stock_status: 'IN_STOCK' | 'OUT_OF_STOCK' };
  }[];
}

function toSummary(p: RawProduct): ProductSummary {
  const { regular_price, final_price } = p.price_range.minimum_price;
  return {
    sku: p.sku,
    name: p.name,
    image: p.small_image?.url ?? '',
    price: final_price.value,
    regularPrice: regular_price.value,
    currency: final_price.currency,
    inStock: p.stock_status === 'IN_STOCK',
  };
}

function toPage(raw: {
  items: RawProduct[];
  total_count: number;
  page_info: { total_pages: number };
}): ProductPage {
  return {
    items: raw.items.map(toSummary),
    totalCount: raw.total_count,
    totalPages: raw.page_info.total_pages,
  };
}

const CART_FIELDS = `
  id
  email
  total_quantity
  items {
    uid
    quantity
    product { sku name small_image { url } }
    prices {
      price { value currency }
      row_total { value currency }
    }
    ... on ConfigurableCartItem {
      configurable_options { option_label value_label }
    }
  }
  prices {
    subtotal_including_tax { value currency }
    grand_total { value currency }
  }
  shipping_addresses {
    available_shipping_methods {
      carrier_code method_code carrier_title method_title available
      amount { value }
    }
    selected_shipping_method {
      carrier_code method_code carrier_title method_title
      amount { value }
    }
  }
  available_payment_methods { code title }
  selected_payment_method { code }
`;

interface RawShippingMethod {
  carrier_code: string;
  method_code: string;
  carrier_title: string;
  method_title: string;
  available?: boolean;
  amount: { value: number };
}

interface RawCart {
  id: string;
  email?: string | null;
  total_quantity: number;
  items: ({
    uid: string;
    quantity: number;
    product: { sku: string; name: string; small_image?: { url: string } | null };
    prices: { price: RawMoney; row_total: RawMoney };
    configurable_options?: { option_label: string; value_label: string }[];
  } | null)[];
  prices: { subtotal_including_tax: RawMoney; grand_total: RawMoney };
  shipping_addresses: {
    available_shipping_methods: RawShippingMethod[] | null;
    selected_shipping_method: RawShippingMethod | null;
  }[];
  available_payment_methods: { code: string; title: string }[];
  selected_payment_method?: { code: string } | null;
}

function toShipping(m: RawShippingMethod): ShippingMethod {
  return {
    carrierCode: m.carrier_code,
    methodCode: m.method_code,
    title: [m.carrier_title, m.method_title].filter(Boolean).join(' – '),
    amount: m.amount.value,
  };
}

function toCart(c: RawCart): Cart {
  const address = c.shipping_addresses[0];
  const selected = address?.selected_shipping_method;
  return {
    id: c.id,
    email: c.email ?? undefined,
    totalQuantity: c.total_quantity,
    items: c.items
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .map((i) => ({
        uid: i.uid,
        sku: i.product.sku,
        name: i.product.name,
        image: i.product.small_image?.url ?? '',
        size: i.configurable_options?.map((o) => o.value_label).join(' / ') || undefined,
        quantity: i.quantity,
        price: i.prices.price.value,
        rowTotal: i.prices.row_total.value,
      })),
    subtotal: c.prices.subtotal_including_tax.value,
    grandTotal: c.prices.grand_total.value,
    currency: c.prices.grand_total.currency,
    shippingMethods: (address?.available_shipping_methods ?? [])
      .filter((m) => m.available !== false)
      .map(toShipping),
    selectedShipping: selected && selected.carrier_code ? toShipping(selected) : undefined,
    paymentMethods: c.available_payment_methods,
    selectedPayment: c.selected_payment_method?.code || undefined,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------- catalog ---------- */

let categoriesCache: Promise<Category[]> | null = null;

interface RawCategory {
  uid: string;
  name: string;
  image?: string | null;
  include_in_menu?: number | null;
  children?: RawCategory[];
}

function toCategory(c: RawCategory): Category {
  return {
    uid: c.uid,
    name: c.name,
    image: c.image || undefined,
    children: (c.children ?? []).filter((x) => x.include_in_menu !== 0).map(toCategory),
  };
}

async function getCategories(): Promise<Category[]> {
  if (!categoriesCache) {
    categoriesCache = gql<{ categoryList: RawCategory[] }>(`
      query {
        categoryList {
          uid
          name
          children {
            uid name image include_in_menu
            children {
              uid name image include_in_menu
              children { uid name image include_in_menu }
            }
          }
        }
      }
    `)
      .then((d) => toCategory(d.categoryList[0] ?? { uid: '', name: '' }).children)
      .catch((e) => {
        categoriesCache = null;
        throw e;
      });
  }
  return categoriesCache;
}

async function getCategoryProducts(categoryUid: string, page: number): Promise<ProductPage> {
  const d = await gql<{ products: Parameters<typeof toPage>[0] }>(
    `query ($uid: String!, $page: Int!, $size: Int!) {
      products(filter: { category_uid: { eq: $uid } }, pageSize: $size, currentPage: $page, sort: { position: ASC }) {
        total_count
        page_info { total_pages }
        items { ${PRODUCT_SUMMARY} }
      }
    }`,
    { uid: categoryUid, page, size: config.PAGE_SIZE },
  );
  return toPage(d.products);
}

async function getNewArrivals(): Promise<ProductSummary[]> {
  let uid = config.NEW_ARRIVALS_CATEGORY_UID;
  if (!uid) uid = (await getCategories())[0]?.uid;
  if (!uid) return [];
  return (await getCategoryProducts(uid, 1)).items.slice(0, 10);
}

async function searchProducts(query: string, page: number): Promise<ProductPage> {
  const d = await gql<{ products: Parameters<typeof toPage>[0] }>(
    `query ($q: String!, $page: Int!, $size: Int!) {
      products(search: $q, pageSize: $size, currentPage: $page) {
        total_count
        page_info { total_pages }
        items { ${PRODUCT_SUMMARY} }
      }
    }`,
    { q: query, page, size: config.PAGE_SIZE },
  );
  return toPage(d.products);
}

async function getProduct(sku: string): Promise<Product | null> {
  const d = await gql<{ products: { items: RawProductDetail[] } }>(
    `query ($sku: String!) {
      products(filter: { sku: { eq: $sku } }) {
        items {
          ${PRODUCT_SUMMARY}
          description { html }
          media_gallery { url position disabled }
          ... on ConfigurableProduct {
            configurable_options {
              attribute_code
              label
              values { uid label }
            }
            variants {
              attributes { uid }
              product { stock_status }
            }
          }
        }
      }
    }`,
    { sku },
  );
  const p = d.products.items[0];
  if (!p) return null;

  const summary = toSummary(p);
  const images = (p.media_gallery ?? [])
    .filter((m) => !m.disabled)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((m) => m.url);

  // Size selector: use the option whose code or label mentions "size", else the first option.
  const options = p.configurable_options ?? [];
  const sizeOption =
    options.find((o) => /size/i.test(o.attribute_code) || /size/i.test(o.label)) ?? options[0];
  const sizes = (sizeOption?.values ?? []).map((v) => ({
    label: v.label,
    uid: v.uid,
    inStock: (p.variants ?? []).some(
      (variant) =>
        variant.product.stock_status === 'IN_STOCK' &&
        variant.attributes.some((a) => a.uid === v.uid),
    ),
  }));

  return {
    ...summary,
    images: images.length ? images : [summary.image].filter(Boolean),
    description: stripHtml(p.description?.html ?? ''),
    sizes,
  };
}

/* ---------- cart ---------- */

async function createCart(): Promise<string> {
  const d = await gql<{ createEmptyCart: string }>(`mutation { createEmptyCart }`);
  return d.createEmptyCart;
}

async function getCart(cartId: string): Promise<Cart> {
  const d = await gql<{ cart: RawCart }>(
    `query ($id: String!) { cart(cart_id: $id) { ${CART_FIELDS} } }`,
    { id: cartId },
  );
  return toCart(d.cart);
}

async function addToCart(
  cartId: string,
  sku: string,
  quantity: number,
  sizeUid?: string,
): Promise<Cart> {
  const d = await gql<{
    addProductsToCart: { cart: RawCart; user_errors: { message: string }[] };
  }>(
    `mutation ($id: String!, $items: [CartItemInput!]!) {
      addProductsToCart(cartId: $id, cartItems: $items) {
        cart { ${CART_FIELDS} }
        user_errors { message }
      }
    }`,
    {
      id: cartId,
      items: [{ sku, quantity, selected_options: sizeUid ? [sizeUid] : [] }],
    },
  );
  const err = d.addProductsToCart.user_errors[0];
  if (err) throw new ApiError(err.message);
  return toCart(d.addProductsToCart.cart);
}

async function updateCartItem(cartId: string, itemUid: string, quantity: number): Promise<Cart> {
  const d = await gql<{ updateCartItems: { cart: RawCart } }>(
    `mutation ($id: String!, $uid: ID!, $qty: Float!) {
      updateCartItems(input: { cart_id: $id, cart_items: [{ cart_item_uid: $uid, quantity: $qty }] }) {
        cart { ${CART_FIELDS} }
      }
    }`,
    { id: cartId, uid: itemUid, qty: quantity },
  );
  return toCart(d.updateCartItems.cart);
}

async function removeCartItem(cartId: string, itemUid: string): Promise<Cart> {
  const d = await gql<{ removeItemFromCart: { cart: RawCart } }>(
    `mutation ($id: String!, $uid: ID!) {
      removeItemFromCart(input: { cart_id: $id, cart_item_uid: $uid }) {
        cart { ${CART_FIELDS} }
      }
    }`,
    { id: cartId, uid: itemUid },
  );
  return toCart(d.removeItemFromCart.cart);
}

/* ---------- checkout ---------- */

async function setGuestEmail(cartId: string, email: string): Promise<void> {
  await gql(
    `mutation ($id: String!, $email: String!) {
      setGuestEmailOnCart(input: { cart_id: $id, email: $email }) { cart { email } }
    }`,
    { id: cartId, email },
  );
}

async function setAddress(cartId: string, a: Address): Promise<Cart> {
  // Qatar addresses: building / street / zone go into Magento's street lines.
  const address = {
    firstname: a.firstname,
    lastname: a.lastname,
    street: [`Building ${a.building}, Street ${a.street}`, `Zone ${a.zone}`],
    city: a.city,
    postcode: config.DEFAULT_POSTCODE,
    country_code: 'QA',
    telephone: `+974${a.mobile}`,
    save_in_address_book: false,
  };
  const d = await gql<{ setBillingAddressOnCart: { cart: RawCart } }>(
    `mutation ($id: String!, $address: CartAddressInput!) {
      setShippingAddressesOnCart(input: { cart_id: $id, shipping_addresses: [{ address: $address }] }) {
        cart { id }
      }
      setBillingAddressOnCart(input: { cart_id: $id, billing_address: { address: $address } }) {
        cart { ${CART_FIELDS} }
      }
    }`,
    { id: cartId, address },
  );
  return toCart(d.setBillingAddressOnCart.cart);
}

async function setShippingMethod(cartId: string, m: ShippingMethod): Promise<Cart> {
  const d = await gql<{ setShippingMethodsOnCart: { cart: RawCart } }>(
    `mutation ($id: String!, $carrier: String!, $method: String!) {
      setShippingMethodsOnCart(input: {
        cart_id: $id,
        shipping_methods: [{ carrier_code: $carrier, method_code: $method }]
      }) {
        cart { ${CART_FIELDS} }
      }
    }`,
    { id: cartId, carrier: m.carrierCode, method: m.methodCode },
  );
  return toCart(d.setShippingMethodsOnCart.cart);
}

async function setPaymentMethod(cartId: string, code: string): Promise<Cart> {
  const d = await gql<{ setPaymentMethodOnCart: { cart: RawCart } }>(
    `mutation ($id: String!, $code: String!) {
      setPaymentMethodOnCart(input: { cart_id: $id, payment_method: { code: $code } }) {
        cart { ${CART_FIELDS} }
      }
    }`,
    { id: cartId, code },
  );
  return toCart(d.setPaymentMethodOnCart.cart);
}

async function placeOrder(cartId: string): Promise<string> {
  const d = await gql<{ placeOrder: { order: { order_number: string } } }>(
    `mutation ($id: String!) {
      placeOrder(input: { cart_id: $id }) { order { order_number } }
    }`,
    { id: cartId },
  );
  return d.placeOrder.order.order_number;
}

/* ---------- account ---------- */

async function signIn(email: string, password: string): Promise<string> {
  const d = await gql<{ generateCustomerToken: { token: string } }>(
    `mutation ($email: String!, $password: String!) {
      generateCustomerToken(email: $email, password: $password) { token }
    }`,
    { email, password },
  );
  return d.generateCustomerToken.token;
}

async function register(input: RegisterInput): Promise<string> {
  await gql(
    `mutation ($input: CustomerCreateInput!) {
      createCustomerV2(input: $input) { customer { email } }
    }`,
    { input },
  );
  return signIn(input.email, input.password);
}

async function signOut(): Promise<void> {
  try {
    await gql(`mutation { revokeCustomerToken { result } }`);
  } catch {
    // Token may already be expired; signing out locally is enough.
  }
}

async function getCustomer(): Promise<Customer> {
  const d = await gql<{ customer: Customer }>(`query { customer { firstname lastname email } }`);
  return d.customer;
}

async function getCustomerCartId(): Promise<string> {
  const d = await gql<{ customerCart: { id: string } }>(`query { customerCart { id } }`);
  return d.customerCart.id;
}

async function mergeCarts(sourceCartId: string, destinationCartId: string): Promise<Cart> {
  const d = await gql<{ mergeCarts: RawCart }>(
    `mutation ($src: String!, $dst: String!) {
      mergeCarts(source_cart_id: $src, destination_cart_id: $dst) { ${CART_FIELDS} }
    }`,
    { src: sourceCartId, dst: destinationCartId },
  );
  return toCart(d.mergeCarts);
}

async function getOrders(): Promise<Order[]> {
  const d = await gql<{
    customer: {
      orders: {
        items: {
          number: string;
          order_date: string;
          status: string;
          total: { grand_total: RawMoney };
        }[];
      };
    };
  }>(`query {
    customer {
      orders(pageSize: 50, sort: { sort_field: CREATED_AT, sort_direction: DESC }) {
        items { number order_date status total { grand_total { value currency } } }
      }
    }
  }`);
  return d.customer.orders.items.map((o) => ({
    number: o.number,
    date: o.order_date,
    status: o.status,
    total: o.total.grand_total.value,
    currency: o.total.grand_total.currency,
  }));
}

export const magentoApi: ShopApi = {
  setToken: (token) => {
    authToken = token;
  },
  getCategories,
  getCategoryProducts,
  getNewArrivals,
  searchProducts,
  getProduct,
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  setGuestEmail,
  setAddress,
  setShippingMethod,
  setPaymentMethod,
  placeOrder,
  signIn,
  register,
  signOut,
  getCustomer,
  getCustomerCartId,
  mergeCarts,
  getOrders,
};
