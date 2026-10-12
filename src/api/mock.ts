/**
 * Demo backend: sample catalog, in-memory bag, accounts and orders.
 * Used when `USE_MOCK` is true in src/config.ts.
 */
import { config } from '../config';
import type {
  Address,
  Cart,
  CartItem,
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

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const img = (seed: string, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/* ---------- catalog ---------- */

const leaf = (uid: string, name: string): Category => ({ uid, name, children: [] });

const categories: Category[] = [
  {
    uid: 'women',
    name: 'Women',
    image: img('gl-women', 800, 600),
    children: [
      leaf('women-clothing', 'Clothing'),
      leaf('women-shoes', 'Shoes'),
      leaf('women-bags', 'Bags'),
    ],
  },
  {
    uid: 'men',
    name: 'Men',
    image: img('gl-men', 800, 600),
    children: [leaf('men-clothing', 'Clothing'), leaf('men-shoes', 'Shoes')],
  },
  {
    uid: 'beauty',
    name: 'Beauty',
    image: img('gl-beauty', 800, 600),
    children: [leaf('beauty-fragrance', 'Fragrance'), leaf('beauty-skincare', 'Skincare')],
  },
  {
    uid: 'kids',
    name: 'Kids',
    image: img('gl-kids', 800, 600),
    children: [leaf('kids-girls', 'Girls'), leaf('kids-boys', 'Boys')],
  },
  {
    uid: 'home',
    name: 'Home',
    image: img('gl-home', 800, 600),
    children: [leaf('home-tableware', 'Tableware'), leaf('home-decor', 'Decor')],
  },
];

const CLOTHING = ['XS', 'S', 'M', 'L', 'XL'];
const SHOES_W = ['36', '37', '38', '39', '40', '41'];
const SHOES_M = ['40', '41', '42', '43', '44', '45'];
const KIDS = ['4Y', '6Y', '8Y', '10Y', '12Y'];

interface Seed {
  name: string;
  brand: string;
  price: number;
  sale?: number;
  sizes?: string[];
  /** Sizes that are sold out. 'all' = whole product sold out. */
  soldOut?: string[] | 'all';
}

const seeds: Record<string, Seed[]> = {
  'women-clothing': [
    { name: 'Silk Wrap Midi Dress', brand: 'Sandro', price: 1890, sizes: CLOTHING, soldOut: ['XS'] },
    { name: 'Tailored Wool Blazer', brand: 'Maje', price: 2450, sale: 1715, sizes: CLOTHING },
    { name: 'Pleated Satin Skirt', brand: 'Claudie Pierlot', price: 1150, sizes: CLOTHING, soldOut: ['M', 'L'] },
    { name: 'Cashmere Crew Sweater', brand: 'Galeries Lafayette', price: 950, sizes: CLOTHING },
    { name: 'Linen Wide-Leg Trousers', brand: 'Ba&sh', price: 1280, sale: 896, sizes: CLOTHING },
    { name: 'Embroidered Abaya', brand: 'Galeries Lafayette', price: 2100, sizes: ['52', '54', '56', '58'], soldOut: 'all' },
  ],
  'women-shoes': [
    { name: 'Leather Slingback Pumps', brand: 'Repetto', price: 1650, sizes: SHOES_W, soldOut: ['36', '41'] },
    { name: 'Suede Ballet Flats', brand: 'Repetto', price: 1120, sizes: SHOES_W },
    { name: 'Chunky Leather Sneakers', brand: 'Veja', price: 690, sale: 483, sizes: SHOES_W },
  ],
  'women-bags': [
    { name: 'Quilted Leather Shoulder Bag', brand: 'Lancel', price: 3450 },
    { name: 'Canvas Tote', brand: 'Galeries Lafayette', price: 320 },
    { name: 'Mini Crossbody Bag', brand: 'Longchamp', price: 1490, sale: 1043 },
  ],
  'men-clothing': [
    { name: 'Oxford Cotton Shirt', brand: 'The Kooples', price: 690, sizes: CLOTHING },
    { name: 'Slim Chino Trousers', brand: 'Sandro Homme', price: 890, sale: 623, sizes: CLOTHING, soldOut: ['S'] },
    { name: 'Merino Polo', brand: 'Lacoste', price: 540, sizes: CLOTHING },
    { name: 'Classic Kandura', brand: 'Galeries Lafayette', price: 780, sizes: ['54', '56', '58', '60', '62'] },
  ],
  'men-shoes': [
    { name: 'Leather Derby Shoes', brand: 'Paraboot', price: 1990, sizes: SHOES_M },
    { name: 'Suede Loafers', brand: 'J.M. Weston', price: 3200, sizes: SHOES_M, soldOut: ['40', '45'] },
    { name: 'Low-top Sneakers', brand: 'Veja', price: 650, sizes: SHOES_M, soldOut: 'all' },
  ],
  'beauty-fragrance': [
    { name: 'Oud Royal Eau de Parfum 100ml', brand: 'Maison Lafayette', price: 1250 },
    { name: 'Rose Absolue Eau de Parfum 50ml', brand: 'Guerlain', price: 890, sale: 712 },
    { name: 'Neroli Eau de Toilette 100ml', brand: 'Diptyque', price: 720 },
  ],
  'beauty-skincare': [
    { name: 'Hydrating Face Cream 50ml', brand: 'Clarins', price: 410 },
    { name: 'Vitamin C Serum 30ml', brand: 'Caudalie', price: 295, sale: 236 },
  ],
  'kids-girls': [
    { name: 'Floral Cotton Dress', brand: 'Bonpoint', price: 560, sizes: KIDS },
    { name: 'Denim Jacket', brand: 'Petit Bateau', price: 340, sale: 238, sizes: KIDS, soldOut: ['4Y'] },
  ],
  'kids-boys': [
    { name: 'Striped Polo Shirt', brand: 'Petit Bateau', price: 210, sizes: KIDS },
    { name: 'Canvas Sneakers', brand: 'Bonpoint', price: 380, sizes: ['28', '29', '30', '31', '32'] },
  ],
  'home-tableware': [
    { name: 'Porcelain Dinner Set, 18 pieces', brand: 'Bernardaud', price: 2900 },
    { name: 'Crystal Tumblers, Set of 4', brand: 'Baccarat', price: 1850 },
  ],
  'home-decor': [
    { name: 'Scented Candle Figuier 190g', brand: 'Diptyque', price: 290 },
    { name: 'Linen Cushion Cover', brand: 'Galeries Lafayette', price: 180, sale: 126 },
  ],
};

const DESCRIPTION =
  'Selected by our buyers in Paris and available at Galeries Lafayette Doha.\n\n' +
  '• Free returns within 14 days\n• Delivery across Qatar\n• Gift wrapping available in store';

const products: Product[] = [];
const productCategory: Record<string, string> = {};

for (const [catUid, list] of Object.entries(seeds)) {
  list.forEach((s, i) => {
    const sku = `${catUid}-${i + 1}`.toUpperCase();
    const allSoldOut = s.soldOut === 'all';
    const sizes = (s.sizes ?? []).map((label) => ({
      label,
      uid: `${sku}:${label}`,
      inStock: !allSoldOut && !(Array.isArray(s.soldOut) && s.soldOut.includes(label)),
    }));
    products.push({
      sku,
      name: s.name,
      brand: s.brand,
      image: img(sku),
      images: [img(sku), img(`${sku}-b`), img(`${sku}-c`)],
      price: s.sale ?? s.price,
      regularPrice: s.price,
      currency: config.CURRENCY,
      inStock: !allSoldOut,
      description: DESCRIPTION,
      sizes,
    });
    productCategory[sku] = catUid;
  });
}

const summary = ({ images, description, sizes, ...rest }: Product): ProductSummary => rest;

function paginate(list: Product[], page: number): ProductPage {
  const size = config.PAGE_SIZE;
  return {
    items: list.slice((page - 1) * size, page * size).map(summary),
    totalCount: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size)),
  };
}

function inCategory(sku: string, uid: string) {
  const cat = productCategory[sku];
  return cat === uid || cat.startsWith(`${uid}-`);
}

/* ---------- cart ---------- */

interface MockCart {
  id: string;
  email?: string;
  items: (CartItem & { sizeUid?: string })[];
  address?: Address;
  shipping?: ShippingMethod;
  payment?: string;
  active: boolean;
}

const carts = new Map<string, MockCart>();
let nextId = 1;

const shippingMethods: ShippingMethod[] = [
  { carrierCode: 'flatrate', methodCode: 'standard', title: 'Standard delivery (2–3 days)', amount: 25 },
  { carrierCode: 'express', methodCode: 'sameday', title: 'Same-day delivery in Doha', amount: 50 },
  { carrierCode: 'pickup', methodCode: 'store', title: 'Click & collect – Doha Festival City', amount: 0 },
];

const paymentMethods = [
  { code: 'cashondelivery', title: 'Cash on Delivery' },
  { code: 'demo_card', title: 'Credit / debit card' },
];

function cartOrThrow(cartId: string): MockCart {
  const c = carts.get(cartId);
  if (!c || !c.active) throw new Error("The cart isn't active.");
  return c;
}

function view(c: MockCart): Cart {
  const subtotal = c.items.reduce((s, i) => s + i.rowTotal, 0);
  const shippingAmount = c.shipping?.amount ?? 0;
  return {
    id: c.id,
    email: c.email,
    items: c.items.map(({ sizeUid, ...i }) => i),
    totalQuantity: c.items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    grandTotal: subtotal + shippingAmount,
    currency: config.CURRENCY,
    shippingMethods: c.address ? shippingMethods : [],
    selectedShipping: c.shipping,
    paymentMethods,
    selectedPayment: c.payment,
  };
}

function newCart(): MockCart {
  const c: MockCart = { id: `mock-cart-${nextId++}`, items: [], active: true };
  carts.set(c.id, c);
  return c;
}

/* ---------- accounts ---------- */

interface MockAccount extends Customer {
  password: string;
  cartId: string;
  orders: Order[];
}

const accounts = new Map<string, MockAccount>();
accounts.set('demo@galerieslafayette.qa', {
  firstname: 'Demo',
  lastname: 'Customer',
  email: 'demo@galerieslafayette.qa',
  password: 'demo1234',
  cartId: newCart().id,
  orders: [
    { number: '000001024', date: '2026-09-02 14:21:00', status: 'Complete', total: 1915, currency: config.CURRENCY },
  ],
});

let token: string | null = null;
const sessions = new Map<string, string>(); // token -> email
let nextOrder = 1100;

function account(): MockAccount {
  const email = token ? sessions.get(token) : undefined;
  const a = email ? accounts.get(email) : undefined;
  if (!a) throw new Error('Please sign in again.');
  if (!carts.get(a.cartId)?.active) a.cartId = newCart().id;
  return a;
}

/* ---------- api ---------- */

export const mockApi: ShopApi = {
  setToken(t) {
    token = t;
  },

  async getCategories() {
    await delay();
    return categories;
  },

  async getCategoryProducts(uid, page) {
    await delay();
    return paginate(
      products.filter((p) => inCategory(p.sku, uid)),
      page,
    );
  },

  async getNewArrivals() {
    await delay();
    // One product from each sub-category, for variety.
    return Object.keys(seeds)
      .map((cat) => products.find((p) => productCategory[p.sku] === cat)!)
      .map(summary);
  },

  async searchProducts(query, page) {
    await delay();
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return paginate(
      products.filter((p) => {
        const text = `${p.name} ${p.brand} ${productCategory[p.sku]}`.toLowerCase();
        return words.every((w) => text.includes(w));
      }),
      page,
    );
  },

  async getProduct(sku) {
    await delay();
    return products.find((p) => p.sku === sku) ?? null;
  },

  async createCart() {
    await delay(100);
    return newCart().id;
  },

  async getCart(cartId) {
    await delay(100);
    return view(cartOrThrow(cartId));
  },

  async addToCart(cartId, sku, quantity, sizeUid) {
    await delay();
    const c = cartOrThrow(cartId);
    const p = products.find((x) => x.sku === sku);
    if (!p) throw new Error('Product not found.');
    const size = p.sizes.find((s) => s.uid === sizeUid);
    if (p.sizes.length && !size) throw new Error('Please choose a size.');
    if (!p.inStock || (size && !size.inStock)) throw new Error('This item is sold out.');

    const existing = c.items.find((i) => i.sku === sku && i.sizeUid === sizeUid);
    if (existing) {
      existing.quantity += quantity;
      existing.rowTotal = existing.quantity * existing.price;
    } else {
      c.items.push({
        uid: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sku,
        name: `${p.brand} ${p.name}`,
        image: p.image,
        size: size?.label,
        sizeUid,
        quantity,
        price: p.price,
        rowTotal: p.price * quantity,
      });
    }
    return view(c);
  },

  async updateCartItem(cartId, itemUid, quantity) {
    await delay(150);
    const c = cartOrThrow(cartId);
    const item = c.items.find((i) => i.uid === itemUid);
    if (item) {
      item.quantity = quantity;
      item.rowTotal = quantity * item.price;
    }
    return view(c);
  },

  async removeCartItem(cartId, itemUid) {
    await delay(150);
    const c = cartOrThrow(cartId);
    c.items = c.items.filter((i) => i.uid !== itemUid);
    return view(c);
  },

  async setGuestEmail(cartId, email) {
    await delay(100);
    cartOrThrow(cartId).email = email;
  },

  async setAddress(cartId, address) {
    await delay();
    const c = cartOrThrow(cartId);
    c.address = address;
    return view(c);
  },

  async setShippingMethod(cartId, method) {
    await delay(150);
    const c = cartOrThrow(cartId);
    c.shipping = method;
    return view(c);
  },

  async setPaymentMethod(cartId, code) {
    await delay(150);
    const c = cartOrThrow(cartId);
    c.payment = code;
    return view(c);
  },

  async placeOrder(cartId) {
    await delay(600);
    const c = cartOrThrow(cartId);
    if (!c.items.length) throw new Error('Your bag is empty.');
    if (!c.address) throw new Error('Please enter a delivery address.');
    if (!c.shipping) throw new Error('Please choose a delivery method.');
    if (!c.payment) throw new Error('Please choose a payment method.');
    c.active = false;
    const number = `00000${nextOrder++}`;
    const owner = [...accounts.values()].find((a) => a.cartId === cartId);
    owner?.orders.unshift({
      number,
      date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'Pending',
      total: view(c).grandTotal,
      currency: config.CURRENCY,
    });
    return number;
  },

  async signIn(email, password) {
    await delay(400);
    const a = accounts.get(email.trim().toLowerCase());
    if (!a || a.password !== password) {
      throw new Error('The account sign-in was incorrect. Please try again.');
    }
    const t = `mock-token-${Date.now()}`;
    sessions.set(t, a.email);
    return t;
  },

  async register(input: RegisterInput) {
    await delay(400);
    const email = input.email.trim().toLowerCase();
    if (accounts.has(email)) throw new Error('An account with this email already exists.');
    accounts.set(email, { ...input, email, cartId: newCart().id, orders: [] });
    return mockApi.signIn(email, input.password);
  },

  async signOut() {
    await delay(100);
    if (token) sessions.delete(token);
  },

  async getCustomer() {
    await delay(100);
    const { firstname, lastname, email } = account();
    return { firstname, lastname, email };
  },

  async getCustomerCartId() {
    await delay(100);
    return account().cartId;
  },

  async mergeCarts(sourceCartId, destinationCartId) {
    await delay();
    const src = carts.get(sourceCartId);
    const dst = cartOrThrow(destinationCartId);
    if (src && src.active && src !== dst) {
      for (const item of src.items) {
        const same = dst.items.find((i) => i.sku === item.sku && i.sizeUid === item.sizeUid);
        if (same) {
          same.quantity += item.quantity;
          same.rowTotal = same.quantity * same.price;
        } else {
          dst.items.push({ ...item });
        }
      }
      src.active = false;
    }
    return view(dst);
  },

  async getOrders() {
    await delay();
    return account().orders;
  },
};
