export interface Category {
  uid: string;
  name: string;
  image?: string;
  children: Category[];
}

export interface ProductSummary {
  sku: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  regularPrice: number;
  currency: string;
  inStock: boolean;
}

export interface SizeOption {
  label: string;
  /** Magento configurable option value uid (sent as `selected_options`). */
  uid: string;
  inStock: boolean;
}

export interface Product extends ProductSummary {
  images: string[];
  description: string;
  /** Empty for simple products. */
  sizes: SizeOption[];
}

export interface ProductPage {
  items: ProductSummary[];
  totalCount: number;
  totalPages: number;
}

export interface CartItem {
  uid: string;
  sku: string;
  name: string;
  image: string;
  size?: string;
  quantity: number;
  price: number;
  rowTotal: number;
}

export interface ShippingMethod {
  carrierCode: string;
  methodCode: string;
  title: string;
  amount: number;
}

export interface PaymentMethod {
  code: string;
  title: string;
}

export interface Cart {
  id: string;
  email?: string;
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  grandTotal: number;
  currency: string;
  shippingMethods: ShippingMethod[];
  selectedShipping?: ShippingMethod;
  paymentMethods: PaymentMethod[];
  selectedPayment?: string;
}

export interface Address {
  firstname: string;
  lastname: string;
  zone: string;
  street: string;
  building: string;
  city: string;
  /** 8-digit Qatar mobile number, without +974. */
  mobile: string;
}

export interface Customer {
  firstname: string;
  lastname: string;
  email: string;
}

export interface Order {
  number: string;
  date: string;
  status: string;
  total: number;
  currency: string;
}

export interface RegisterInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

/** Everything the app needs from the backend. Implemented by magento.ts and mock.ts. */
export interface ShopApi {
  setToken(token: string | null): void;

  getCategories(): Promise<Category[]>;
  getCategoryProducts(categoryUid: string, page: number): Promise<ProductPage>;
  getNewArrivals(): Promise<ProductSummary[]>;
  searchProducts(query: string, page: number): Promise<ProductPage>;
  getProduct(sku: string): Promise<Product | null>;

  createCart(): Promise<string>;
  getCart(cartId: string): Promise<Cart>;
  addToCart(cartId: string, sku: string, quantity: number, sizeUid?: string): Promise<Cart>;
  updateCartItem(cartId: string, itemUid: string, quantity: number): Promise<Cart>;
  removeCartItem(cartId: string, itemUid: string): Promise<Cart>;

  setGuestEmail(cartId: string, email: string): Promise<void>;
  setAddress(cartId: string, address: Address): Promise<Cart>;
  setShippingMethod(cartId: string, method: ShippingMethod): Promise<Cart>;
  setPaymentMethod(cartId: string, code: string): Promise<Cart>;
  placeOrder(cartId: string): Promise<string>;

  signIn(email: string, password: string): Promise<string>;
  register(input: RegisterInput): Promise<string>;
  signOut(): Promise<void>;
  getCustomer(): Promise<Customer>;
  getCustomerCartId(): Promise<string>;
  mergeCarts(sourceCartId: string, destinationCartId: string): Promise<Cart>;
  getOrders(): Promise<Order[]>;
}
