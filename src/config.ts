/**
 * App settings. Change these to point the app at the live store.
 */
export const config = {
  /** true = demo mode with sample products (no API access needed). */
  USE_MOCK: true,

  /** Magento store base URL. The app calls `${MAGENTO_URL}/graphql`. */
  MAGENTO_URL: 'https://www.galerieslafayette.qa',

  /** Magento store view code, sent as the `Store` header. */
  STORE_CODE: 'default',

  /**
   * Category shown in the home "Just arrived" carousel.
   * Leave empty to use the first department.
   */
  NEW_ARRIVALS_CATEGORY_UID: '',

  /** Qatar has no postcodes; this placeholder is sent in case Magento requires one. */
  DEFAULT_POSTCODE: '00000',

  /** Default city for delivery addresses. */
  DEFAULT_CITY: 'Doha',

  CURRENCY: 'QAR',

  PAGE_SIZE: 20,
};
