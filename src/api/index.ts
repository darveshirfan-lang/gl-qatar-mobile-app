import { config } from '../config';
import type { ShopApi } from '../types';
import { magentoApi } from './magento';
import { mockApi } from './mock';

export const api: ShopApi = config.USE_MOCK ? mockApi : magentoApi;

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}
