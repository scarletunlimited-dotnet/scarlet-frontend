import { 
  ApiResponse, 
  PaginatedResponse, 
  Product, 
  Category, 
  CategoryTree,
  CategoryHierarchy,
  Cart, 
  Order, 
  User,
  ProductQuery,
  CheckoutFormData,
  LoginFormData,
  RegisterFormData,
  AuthUser,
  AppError,
  Address,
  CreateAddressData,
  WishlistItem,
  BlogPost,
  BlogCategory,
  BlogQuery,
  BlogStats,
  Brand,
  BrandTree,
  BrandHierarchy,
  BrandStats,
  CreditWallet,
  CreditTransaction,
  Referral,
  ReferralStats,
  CreditRedemptionValidation,
  CreditBalance
} from './types';
import {
  AdminStats,
  AdminUser,
  AdminProduct,
  AdminOrder,
  AdminUserFilters,
  AdminProductFilters,
  AdminOrderFilters,
  AdminPaginatedResponse,
  UserAnalytics,
  SystemSettings,
  AdminActivityLog,
  AdminActivityLogFilters,
  AdminActivityStats
} from './admin-types';
// import { validateProduct, validateUser, validateOrder, safeApiCall } from './validation';
export { paymentApi } from './api/payments';

// OTP Types
export interface OTPRequest {
  phone: string;
  purpose: 'guest_checkout' | 'phone_verification' | 'password_reset';
}

export interface OTPVerification {
  phone: string;
  code: string;
  sessionId: string;
  purpose: 'guest_checkout' | 'phone_verification' | 'password_reset';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  attemptsRemaining?: number;
  otp?: string; // Include OTP for development/testing purposes
}

export interface OTPStatus {
  verified: boolean;
  expiresAt?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  sessionId: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'search' | 'filter' | 'wishlist_add' | 'wishlist_remove';
  eventData: Record<string, string | number | boolean | null>;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantity: number;
    orders: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface TrafficAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    averageTime: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    conversions: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
    visitors: number;
  }>;
}

export interface RecentEvent {
  id: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  productId?: string;
  page: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface RealTimeAnalytics {
  activeUsers: number;
  currentPageViews: number;
  recentEvents: RecentEvent[];
  topPages: Array<{
    page: string;
    views: number;
  }>;
  topProducts: Array<{
    productId: string;
    views: number;
  }>;
  conversionFunnel: {
    visitors: number;
    addToCart: number;
    checkoutStart: number;
    checkoutComplete: number;
  };
}


export const API_BASE = process.env['NEXT_PUBLIC_API_URL'] 
  ? `${process.env['NEXT_PUBLIC_API_URL']}/api`
  : process.env['NEXT_PUBLIC_API_BASE'] || '/api/proxy';

const isDevLogging = process.env.NODE_ENV !== 'production';

/* eslint-disable no-console */
const devLog = (...args: unknown[]) => {
  if (isDevLogging) {
    console.log(...args);
  }
};
/* eslint-enable no-console */

// Unified API configuration - works for all devices
export const API_CONFIG = {
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds - sufficient for all networks
  retries: 3,
  retryDelay: 1000, // 1 second between retries
  // Connection quality detection
  connectionQuality: 'auto' as 'auto' | 'fast' | 'slow',
};

// Unified fetch configuration - no device-specific logic
const getUnifiedFetchConfig = (init?: RequestInit): RequestInit => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // Enhanced cache-busting for development
      'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'no-cache',
      'Pragma': 'no-cache',
      // Add timestamp for development to ensure fresh requests
      ...(isDevelopment && {
        'X-Timestamp': Date.now().toString(),
      }),
      ...init?.headers,
    },
    // Universal fetch options that work well on all devices
    mode: 'cors',
    credentials: 'include',
    keepalive: true,
  };
};

// Mobile connection test function
export interface MobileConnectionTestResult {
  success: boolean;
  data?: {
    status: string;
    timestamp: string;
    serverTime: string;
    environment: string;
  };
  error?: string;
}

export async function testMobileConnection(): Promise<MobileConnectionTestResult> {
  try {
    const response = await fetch(`${API_BASE}/mobile-debug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Mobile connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public field?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Retry utility function for network requests with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors) except for network errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 0) {
        throw error; // Don't retry client errors
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      devLog(`⚠️ Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Generic fetch function with type safety and enhanced error handling
export async function fetchJson<T = unknown>(
  path: string, 
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  // Debug logging for chat API calls (dev only)
  if (isDevLogging && path.includes('/chat/')) {
    devLog('Fetch Debug:', {
      path,
      url,
      API_BASE,
      method: init?.method || 'GET',
      hasAuth: !!(init?.headers as any)?.['Authorization']
    });
  }
  
  // Determine if this is dynamic content that should never be cached
  const isDynamicContent = /^\/(cart|orders|auth|users|checkout|wishlist|payments|addresses|cart-abandonment)/.test(path);
  
  // Merge cache settings - init.cache takes precedence, then isDynamicContent
  const cacheOption = init?.cache || (isDynamicContent ? 'no-store' : undefined);
  
  const config: RequestInit = getUnifiedFetchConfig({
    ...init,
    // Set cache option if specified
    ...(cacheOption && { cache: cacheOption }),
  });

  try {
    if (isDevLogging) {
      devLog(`🌐 API Call: ${config.method || 'GET'} ${url}`);
    }
    
    const response = await fetch(url, config);
    const body: ApiResponse<T> = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`, body.error);
      const errorData = body.error as any;
      throw new ApiError(
        errorData?.message || `Request failed with status ${response.status}`,
        response.status,
        errorData?.code,
        errorData?.field,
        errorData?.details
      );
    }

    if (!body.success) {
      console.error(`❌ API Error: Request failed`, body.error);
      const errorData = body.error as any;
      throw new ApiError(
        errorData?.message || 'Request failed',
        response.status,
        errorData?.code,
        errorData?.field,
        errorData?.details
      );
    }

    if (isDevLogging) {
      devLog(`✅ API Success: ${config.method || 'GET'} ${url}`);
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error(`🔥 Network Error:`, error);
    
    // Enhanced error handling for different error types
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Network connectivity issues
      throw new ApiError(
        `Network error: Unable to connect to ${url}. Please check if the backend server is running.`,
        0
      );
    } else if (error instanceof SyntaxError) {
      // JSON parsing errors
      throw new ApiError(
        `Invalid response format from ${url}. The server may not be responding correctly.`,
        0
      );
    } else {
      // Other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return payload.exp < (now + bufferTime);
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

// Token refresh function
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    if (isDevLogging) {
      devLog('❌ No refresh token available');
    }
    return null;
  }

  try {
    if (isDevLogging) {
      devLog('🔄 Attempting to refresh access token...');
    }
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      if (isDevLogging) {
        devLog('❌ Token refresh failed:', response.status, response.statusText);
      }
      
      // Try to get error details
      try {
        const errorData = await response.json();
        if (isDevLogging) {
          devLog('❌ Error details:', errorData);
        }
      } catch (e) {
        if (isDevLogging) {
          devLog('❌ Could not parse error response');
        }
      }
      
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Dispatch a custom event to notify the auth context
      window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
      return null;
    }

    const data = await response.json();
    if (data.success && data.data.tokens) {
      const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;
      
      // Store new tokens
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      if (isDevLogging) {
        devLog('✅ Access token refreshed successfully');
      }
      return accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    // Clear invalid tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

// Authenticated fetch function with automatic token refresh
export async function fetchJsonAuth<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let token = localStorage.getItem('accessToken');
  
  if (isDevLogging) {
    devLog('🔐 Auth Debug:', {
      hasToken: !!token,
      path,
      method: init?.method || 'GET'
    });
  }
  
  // Check if token is expired and refresh proactively
  if (token && apiUtils.isTokenExpired(token)) {
    if (isDevLogging) {
      devLog('⏰ Token is expired, refreshing proactively...');
    }
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
    } else {
      // If refresh failed, clear tokens and let the request fail
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      token = null;
    }
  }
  
  // First attempt with current token
  try {
    return await fetchJson<T>(path, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
      } as HeadersInit,
    });
  } catch (error: unknown) {
    // If we get a 401 and have a refresh token, try to refresh
    if (error instanceof ApiError && error.status === 401 && localStorage.getItem('refreshToken')) {
      if (isDevLogging) {
        devLog('🔄 Got 401, attempting token refresh...');
      }
      
      const newToken = await refreshAccessToken();
      if (newToken) {
        if (isDevLogging) {
          devLog('🔄 Retrying request with new token...');
        }
        // Retry the original request with the new token
        return await fetchJson<T>(path, {
          ...init,
          headers: {
            ...init?.headers,
            'Authorization': `Bearer ${newToken}`,
          } as HeadersInit,
        });
      }
    }
    
    // If refresh failed or no refresh token, throw the original error
    throw error;
  }
}

// Product API functions
export const productApi = {
  // Get all products with optional filters
  getProducts: (query?: ProductQuery): Promise<PaginatedResponse<Product>> => {
    const searchParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = searchParams.toString();
    const path = `/catalog/products${queryString ? `?${queryString}` : ''}`;
    
    return fetchJson<PaginatedResponse<Product>>(path);
  },

  // Get single product by slug
  getProductBySlug: async (slug: string): Promise<Product> => {
    return fetchJson<Product>(`/catalog/products/${slug}`);
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    return fetchJson<Product>(`/catalog/products/${id}`);
  },

  // Search products
  searchProducts: (query: string, filters?: Partial<ProductQuery>): Promise<PaginatedResponse<Product>> => {
    const searchParams = new URLSearchParams({ search: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    
    return fetchJson<PaginatedResponse<Product>>(`/catalog/products/search?${searchParams.toString()}`);
  },
};

// Category API functions
export const categoryApi = {
  // Get all categories
  getCategories: (options?: { fresh?: boolean; ids?: string[] | string }): Promise<Category[]> => {
    const params = new URLSearchParams();
    
    if (options?.ids) {
      const idsArray = Array.isArray(options.ids) ? options.ids : [options.ids];
      if (idsArray.length > 0) {
        params.append('ids', idsArray.join(','));
      }
    }
    
    if (options?.fresh) {
      params.set('fresh', '1');
    }
    
    const queryString = params.toString();
    return fetchJson<Category[]>(`/catalog/categories${queryString ? `?${queryString}` : ''}`);
  },

  // Get category by slug
  getCategoryBySlug: (slug: string): Promise<Category> => {
    return fetchJson<Category>(`/catalog/categories/slug/${slug}`);
  },

  // Get products in category
  getCategoryProducts: (categoryId: string, query?: Partial<ProductQuery>): Promise<PaginatedResponse<Product>> => {
    const searchParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    const path = `/catalog/categories/${categoryId}/products${queryString ? `?${queryString}` : ''}`;
    
    return fetchJson<PaginatedResponse<Product>>(path);
  },

  // Create category
  createCategory: async (categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    const category = await fetchJsonAuth<Category>('/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    clearCategoryCaches();
    return category;
  },

  // Update category
  updateCategory: async (categoryId: string, categoryData: Partial<Category>): Promise<Category> => {
    const category = await fetchJsonAuth<Category>(`/catalog/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    clearCategoryCaches();
    return category;
  },

  // Update category sort order (bulk)
  updateCategorySortOrder: async (categoryUpdates: Array<{id: string, sortOrder: number}>): Promise<{message: string}> => {
    const response = await fetchJsonAuth<{message: string}>('/admin/categories/sort-order', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryUpdates }),
    });

    clearCategoryCaches();
    return response;
  },

  // Delete category
  deleteCategory: async (categoryId: string): Promise<void> => {
    await fetchJsonAuth<void>(`/catalog/categories/${categoryId}`, {
      method: 'DELETE',
    });

    clearCategoryCaches();
  },

  // Hierarchy functions
  getCategoryTree: (): Promise<CategoryTree[]> => {
    return fetchJson<CategoryTree[]>('/catalog/categories/tree');
  },

  getCategoryHierarchy: (): Promise<CategoryHierarchy> => {
    return fetchJson<CategoryHierarchy>('/catalog/categories/hierarchy');
  },

  getCategoryChildren: (parentId: string): Promise<Category[]> => {
    return fetchJson<Category[]>(`/catalog/categories/${parentId}/children`);
  },

  getCategoryAncestors: (categoryId: string): Promise<Category[]> => {
    return fetchJson<Category[]>(`/catalog/categories/${categoryId}/ancestors`);
  },

  getCategoryPath: (categoryId: string): Promise<string> => {
    return fetchJson<string>(`/catalog/categories/${categoryId}/path`);
  },

  updateCategoryHierarchy: (categoryId: string, parentId: string | null): Promise<Category> => {
    return fetchJsonAuth<Category>(`/catalog/categories/${categoryId}/hierarchy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parentId }),
    });
  },
};

// Cart API functions
export const cartApi = {
  // Get current user's cart
  getCart: (): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart');
  },

  // Add item to cart
  addItem: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, selectedSize, selectedColor }),
    });
  },

  // Batch add items to cart (optimized for multiple variants - 5x faster)
  addItemsBatch: (items: Array<{ productId: string; quantity: number; selectedSize?: string; selectedColor?: string }>): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart/items/batch', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  // Update item quantity
  updateItem: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart/items', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity, selectedSize, selectedColor }),
    });
  },

  // Remove item from cart
  removeItem: (productId: string, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    const params = new URLSearchParams();
    if (selectedSize) params.append('selectedSize', selectedSize);
    if (selectedColor) params.append('selectedColor', selectedColor);
    const queryString = params.toString();
    return fetchJsonAuth<Cart>(`/cart/items/${productId}${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
    });
  },

  // Clear entire cart
  clearCart: (): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart', {
      method: 'DELETE',
    });
  },

  // Guest cart functions
  getGuestCart: (sessionId: string): Promise<Cart> => {
    return fetchJson<Cart>(`/cart/guest?sessionId=${sessionId}`);
  },

  addGuestItem: (sessionId: string, productId: string, quantity: number, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    return fetchJson<Cart>('/cart/guest/items', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ productId, quantity, selectedSize, selectedColor }),
    });
  },

  // Batch add items to guest cart (optimized for multiple variants - 5x faster)
  addGuestItemsBatch: (sessionId: string, items: Array<{ productId: string; quantity: number; selectedSize?: string; selectedColor?: string }>): Promise<Cart> => {
    return fetchJson<Cart>('/cart/guest/items/batch', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ items }),
    });
  },

  updateGuestItem: (sessionId: string, productId: string, quantity: number, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    return fetchJson<Cart>('/cart/guest/items', {
      method: 'PUT',
      headers: {
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ productId, quantity, selectedSize, selectedColor }),
    });
  },

  removeGuestItem: (sessionId: string, productId: string, selectedSize?: string, selectedColor?: string): Promise<Cart> => {
    const params = new URLSearchParams();
    if (selectedSize) params.append('selectedSize', selectedSize);
    if (selectedColor) params.append('selectedColor', selectedColor);
    const queryString = params.toString();
    return fetchJson<Cart>(`/cart/guest/items/${productId}${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
      headers: {
        'X-Session-ID': sessionId,
      },
    });
  },

  // Clear guest cart
  clearGuestCart: (sessionId: string): Promise<Cart> => {
    return fetchJson<Cart>('/cart/guest', {
      method: 'DELETE',
      headers: {
        'X-Session-ID': sessionId,
      },
    });
  },

  // Merge guest cart to user cart
  mergeGuestCart: (sessionId: string): Promise<Cart> => {
    return fetchJsonAuth<Cart>('/cart/merge-guest', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },
};

// Order API functions
export const orderApi = {
  // Create order from cart
  createOrder: (checkoutData: CheckoutFormData): Promise<Order> => {
    return fetchJsonAuth<Order>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },

  // Create guest order from cart
  createGuestOrder: (sessionId: string, checkoutData: CheckoutFormData): Promise<Order> => {
    return fetchJson<Order>('/orders/guest/create', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ ...checkoutData, sessionId }),
    });
  },

  // Store pending order (for SSLCommerz - order created only after payment)
  storePendingOrder: (checkoutData: CheckoutFormData): Promise<{ orderNumber: string }> => {
    return fetchJsonAuth<{ orderNumber: string }>('/orders/pending', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },

  // Store pending guest order (for SSLCommerz - order created only after payment)
  storePendingGuestOrder: (sessionId: string, checkoutData: CheckoutFormData): Promise<{ orderNumber: string }> => {
    return fetchJson<{ orderNumber: string }>('/orders/pending', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({ ...checkoutData, sessionId }),
    });
  },

  // Get user's orders
  getOrders: (page = 1, limit = 10): Promise<PaginatedResponse<Order>> => {
    return fetchJsonAuth<PaginatedResponse<Order>>(`/orders?page=${page}&limit=${limit}`);
  },

  // Get specific order
  getOrder: async (orderId: string): Promise<Order> => {
    return fetchJsonAuth<Order>(`/orders/${orderId}`);
  },

  // Cancel order
  cancelOrder: (orderId: string, reason?: string): Promise<Order> => {
    return fetchJsonAuth<Order>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Address API functions
export const addressApi = {
  // Get user's addresses
  getAddresses: (): Promise<Address[]> => {
    return fetchJsonAuth<Address[]>('/addresses');
  },

  // Get specific address
  getAddress: (addressId: string): Promise<Address> => {
    return fetchJsonAuth<Address>(`/addresses/${addressId}`);
  },

  // Create new address
  createAddress: (addressData: CreateAddressData): Promise<Address> => {
    return fetchJsonAuth<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  // Update address
  updateAddress: (addressId: string, addressData: Partial<CreateAddressData>): Promise<Address> => {
    return fetchJsonAuth<Address>(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  },

  // Delete address
  deleteAddress: (addressId: string): Promise<{ deleted: boolean }> => {
    return fetchJsonAuth<{ deleted: boolean }>(`/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },

  // Set default address
  setDefaultAddress: (addressId: string): Promise<Address> => {
    return fetchJsonAuth<Address>(`/addresses/${addressId}/default`, {
      method: 'PATCH',
    });
  },
};

// Wishlist API functions
export const wishlistApi = {
  // Get user's wishlist
  getWishlist: (): Promise<{ items: WishlistItem[]; total: number }> => {
    return fetchJsonAuth<{ items: WishlistItem[]; total: number }>('/wishlist');
  },

  // Add item to wishlist with enhanced options for out-of-stock products
  addToWishlist: (productId: string, options?: {
    notifyWhenInStock?: boolean;
    customerNotes?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<WishlistItem> => {
    return fetchJsonAuth<WishlistItem>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ 
        productId,
        notifyWhenInStock: options?.notifyWhenInStock,
        customerNotes: options?.customerNotes,
        priority: options?.priority
      }),
    });
  },

  // Remove item from wishlist
  removeFromWishlist: (productId: string): Promise<{ removed: boolean }> => {
    return fetchJsonAuth<{ removed: boolean }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  },

  // Clear entire wishlist
  clearWishlist: (): Promise<{ cleared: boolean; count: number }> => {
    return fetchJsonAuth<{ cleared: boolean; count: number }>('/wishlist', {
      method: 'DELETE',
    });
  },

  // Check if product is in wishlist
  checkWishlistStatus: (productId: string): Promise<{ isInWishlist: boolean }> => {
    return fetchJsonAuth<{ isInWishlist: boolean }>(`/wishlist/${productId}/status`);
  },

  // Get wishlist statistics
  getWishlistStats: (): Promise<{ count: number }> => {
    return fetchJsonAuth<{ count: number }>('/wishlist/stats');
  },

  // Admin: Get out-of-stock wishlist items
  getOutOfStockItems: (): Promise<OutOfStockWishlistItem[]> => {
    return fetchJsonAuth<OutOfStockWishlistItem[]>('/wishlist/admin/out-of-stock');
  },

  // Admin: Get wishlist analytics
  getWishlistAnalytics: (): Promise<WishlistAnalytics> => {
    return fetchJsonAuth<WishlistAnalytics>('/wishlist/admin/analytics');
  },

  // Admin: Notify customers about restocked items
  notifyCustomersAboutRestock: (productId: string, options?: {
    message?: string;
    estimatedRestockDate?: string;
  }): Promise<{ notified: number; message: string }> => {
    return fetchJsonAuth<{ notified: number; message: string }>('/wishlist/admin/notify-restock', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        message: options?.message,
        estimatedRestockDate: options?.estimatedRestockDate
      }),
    });
  },

  // Admin: Update wishlist item priority
  updateWishlistItemPriority: (wishlistItemId: string, options: {
    priority?: 'low' | 'medium' | 'high';
    estimatedRestockDate?: string;
    adminNotes?: string;
  }): Promise<{ updated: boolean }> => {
    return fetchJsonAuth<{ updated: boolean }>(`/wishlist/admin/items/${wishlistItemId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify(options),
    });
  },
};

// Session types
export interface SecuritySession {
  _id: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  country?: string;
  city?: string;
  ipAddress: string;
  lastActive: string;
  isCurrent?: boolean;
  createdAt: string;
}

export interface SessionsResponse {
  success: boolean;
  data: {
    sessions: SecuritySession[];
  };
}

// Authentication API functions
export const authApi = {
  // Login user
  login: (credentials: LoginFormData): Promise<AuthUser> => {
    return fetchJson<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Register user
  register: (userData: RegisterFormData): Promise<AuthUser> => {
    return fetchJson<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Refresh token
  refreshToken: (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
    return fetchJson<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // Logout
  logout: (): Promise<{ success: boolean }> => {
    return fetchJsonAuth<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  // Request OTP for passwordless login
  requestLoginOTP: (identifier: string): Promise<{ message: string }> => {
    return fetchJson<{ message: string }>('/auth/request-login-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  // Verify OTP and login
  verifyLoginOTP: (identifier: string, otp: string): Promise<AuthUser> => {
    return fetchJson<AuthUser>('/auth/verify-login-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    return fetchJsonAuth<User>('/users/me');
  },

  // Update user profile
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'preferences'>>): Promise<User> => {
    return fetchJsonAuth<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Request password reset
  requestPasswordReset: (email: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: (token: string, newPassword: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Password reset with OTP flow
  sendPasswordResetOTP: (identifier: string, sessionId: string): Promise<{ success: boolean; message: string; sessionId: string }> => {
    return fetchJson<{ success: boolean; message: string; sessionId: string }>('/auth/password-reset/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, sessionId }),
    });
  },

  verifyPasswordResetOTP: (identifier: string, code: string, sessionId: string): Promise<{
    success: boolean;
    resetToken: string;
    expiresAt: string;
    user: { _id: string; email?: string; phone?: string; firstName: string };
  }> => {
    return fetchJson<{
      success: boolean;
      resetToken: string;
      expiresAt: string;
      user: { _id: string; email?: string; phone?: string; firstName: string };
    }>('/auth/password-reset/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, code, sessionId }),
    });
  },

  setNewPassword: (resetToken: string, newPassword: string): Promise<{
    success: boolean;
    user: { _id: string; email?: string; phone?: string; firstName: string };
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> => {
    return fetchJson<{
      success: boolean;
      user: { _id: string; email?: string; phone?: string; firstName: string };
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    }>('/auth/password-reset/set-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },

  // Send phone OTP
  sendPhoneOtp: (phone: string): Promise<{ message: string; otp?: string }> => {
    return fetchJsonAuth<{ message: string; otp?: string }>('/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Verify phone OTP
  verifyPhoneOtp: (phone: string, otp: string): Promise<{ message: string; verified: boolean }> => {
    return fetchJsonAuth<{ message: string; verified: boolean }>('/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  // Get active sessions
  getSessions: async (): Promise<SecuritySession[]> => {
    const response = await fetchJsonAuth<SessionsResponse>('/auth/sessions');
    return response.data?.sessions || [];
  },

  // Terminate a specific session
  terminateSession: (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    return fetchJsonAuth<{ success: boolean; message?: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Terminate all other sessions
  terminateAllSessions: (): Promise<{ success: boolean; message?: string; deletedCount?: number }> => {
    return fetchJsonAuth<{ success: boolean; message?: string; deletedCount?: number }>('/auth/sessions', {
      method: 'DELETE',
    });
  },
};

// Utility functions for handling API responses
export const apiUtils = {
  // Handle API errors consistently
  handleApiError: (error: unknown): AppError => {
    if (error instanceof ApiError) {
      const result: AppError = {
        message: error.message,
      };
      if (error.code) result.code = error.code;
      if (error.status) result.status = error.status;
      if (error.field) result.field = error.field;
      return result;
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  },

  // Format validation errors
  formatValidationErrors: (error: ApiError): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (error.field && error.message) {
      errors[error.field] = error.message;
    }
    
    return errors;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  },

  // Get user from token
  getUserFromToken: (): Partial<User> | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return {
      _id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    } catch {
      return null;
    }
  },

  // Store auth tokens
  storeTokens: (tokens: { accessToken: string; refreshToken: string }): void => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },

  // Clear auth tokens
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Admin API functions
export const adminApi = {
  // Dashboard
  dashboard: {
    getStats: (): Promise<AdminStats> => {
      return fetchJsonAuth<AdminStats>('/admin/dashboard/stats');
    }
  },

  // User Management
  users: {
    getUsers: (filters: AdminUserFilters = {}): Promise<AdminPaginatedResponse<AdminUser>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
      
      return fetchJsonAuth<AdminPaginatedResponse<AdminUser>>(url);
    },

    updateUserRole: (userId: string, role: 'admin' | 'staff' | 'monitor' | 'customer'): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
    },

    deleteUser: (userId: string): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
    }
  },

  // Product Management
  products: {
    getProducts: (filters: AdminProductFilters = {}): Promise<AdminPaginatedResponse<AdminProduct>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = `/admin/products${queryString ? `?${queryString}` : ''}`;
      
      return fetchJsonAuth<AdminPaginatedResponse<AdminProduct>>(url);
    },

    getProduct: (productId: string): Promise<AdminProduct> => {
      return fetchJsonAuth<AdminProduct>(`/admin/products/${productId}`);
    },

    createProduct: (productData: Partial<AdminProduct>): Promise<AdminProduct> => {
      return fetchJsonAuth<AdminProduct>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },

    updateProduct: (productId: string, productData: Partial<AdminProduct>): Promise<AdminProduct> => {
      return fetchJsonAuth<AdminProduct>(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    },

    updateProductStock: (productId: string, stock: number): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock })
      });
    },

    deleteProduct: (productId: string): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
    }
  },

  // Order Management
  orders: {
    getOrders: (filters: AdminOrderFilters = {}): Promise<AdminPaginatedResponse<AdminOrder>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = `/admin/orders${queryString ? `?${queryString}` : ''}`;
      
      return fetchJsonAuth<AdminPaginatedResponse<AdminOrder>>(url);
    },

    getOrderById: (orderId: string): Promise<AdminOrder> => {
      return fetchJsonAuth<AdminOrder>(`/admin/orders/${orderId}`);
    },

    updateOrderStatus: (
      orderId: string, 
      status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'refunded'
    ): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    updatePaymentStatus: (
      orderId: string,
      paymentStatus: 'pending' | 'partial' | 'processing' | 'completed' | 'failed' | 'refunded'
    ): Promise<{ message: string }> => {
      return fetchJsonAuth(`/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus })
      });
    }
  },

  // Analytics
  analytics: {
    getSalesAnalytics: (dateFrom: string, dateTo: string): Promise<SalesAnalytics> => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      return fetchJsonAuth<SalesAnalytics>(`/admin/analytics/sales?${params.toString()}`);
    },

    getUserAnalytics: (): Promise<UserAnalytics> => {
      return fetchJsonAuth<UserAnalytics>('/admin/analytics/users');
    }
  },

  // System Settings
  settings: {
    getSettings: (): Promise<SystemSettings> => {
      return fetchJsonAuth<SystemSettings>('/admin/settings');
    },

    getSystemSettings: (): Promise<SystemSettings> => {
      return fetchJsonAuth<SystemSettings>('/admin/settings');
    },

    updateSystemSettings: (settings: Partial<SystemSettings>): Promise<{ message: string }> => {
      return fetchJsonAuth<{ message: string }>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
    },

    updateSettings: (settings: Partial<SystemSettings>): Promise<{ message: string }> => {
      return fetchJsonAuth<{ message: string }>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
    }
  },

  // Category Management
  categories: {
    getCategories: (filters: AdminUserFilters = {}): Promise<AdminPaginatedResponse<Category>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = `/admin/categories${queryString ? `?${queryString}` : ''}`;
      
      return fetchJsonAuth<AdminPaginatedResponse<Category>>(url);
    },

    getCategory: (categoryId: string): Promise<Category> => {
      return fetchJsonAuth<Category>(`/admin/categories/${categoryId}`);
    },

    createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
      const category = await fetchJsonAuth<Category>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });

      clearCategoryCaches();
      return category;
    },

    updateCategory: async (categoryId: string, categoryData: Partial<Category>): Promise<Category> => {
      const category = await fetchJsonAuth<Category>(`/admin/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });

      clearCategoryCaches();
      return category;
    },

    updateCategoryStatus: async (categoryId: string, isActive: boolean): Promise<{ success: boolean }> => {
      const result = await fetchJsonAuth<{ success: boolean }>(`/admin/categories/${categoryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });

      clearCategoryCaches();
      return result;
    },

    deleteCategory: async (categoryId: string): Promise<{ success: boolean }> => {
      const result = await fetchJsonAuth<{ success: boolean }>(`/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      clearCategoryCaches();
      return result;
    }
  },

  // Activity Logs
  logs: {
    getActivityLogs: (
      filters?: AdminActivityLogFilters,
      page: number = 1,
      limit: number = 50
    ): Promise<AdminPaginatedResponse<AdminActivityLog>> => {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString() 
      });
      
      if (filters) {
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.userEmail) params.append('userEmail', filters.userEmail);
        if (filters.action) params.append('action', filters.action);
        if (filters.resourceType) params.append('resourceType', filters.resourceType);
        if (filters.resourceId) params.append('resourceId', filters.resourceId);
        if (filters.severity) params.append('severity', filters.severity);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.search) params.append('search', filters.search);
        if (filters.ip) params.append('ip', filters.ip);
      }
      
      return fetchJsonAuth<AdminPaginatedResponse<AdminActivityLog>>(`/admin/logs/activity?${params.toString()}`);
    },
    getActivityStats: (dateFrom?: string, dateTo?: string): Promise<AdminActivityStats> => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      return fetchJsonAuth<AdminActivityStats>(`/admin/logs/activity/stats?${params.toString()}`);
    },
    exportActivityLogs: async (
      filters?: AdminActivityLogFilters,
      format: 'csv' | 'json' = 'json'
    ): Promise<Blob> => {
      const params = new URLSearchParams({ format });
      
      if (filters) {
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.userEmail) params.append('userEmail', filters.userEmail);
        if (filters.action) params.append('action', filters.action);
        if (filters.resourceType) params.append('resourceType', filters.resourceType);
        if (filters.resourceId) params.append('resourceId', filters.resourceId);
        if (filters.severity) params.append('severity', filters.severity);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.search) params.append('search', filters.search);
        if (filters.ip) params.append('ip', filters.ip);
      }
      
      // Handle Blob response directly
      const token = localStorage.getItem('token');
      const baseUrl = process.env['NEXT_PUBLIC_API_URL'] || 'https://api.scarletunlimited.net';
      const actualResponse = await fetch(`${baseUrl}/admin/logs/activity/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': format === 'csv' ? 'text/csv' : 'application/json'
        }
      });
      
      return actualResponse.blob();
    }
  },

  // Consultations
  consultations: {
    getConsultations: (filters: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<AdminPaginatedResponse<{
      _id: string;
      name: string;
      email?: string;
      mobile?: string;
      subject: string;
      message: string;
      status: 'pending' | 'read' | 'contacted' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high';
      assignedTo?: string;
      adminNotes?: string;
      contactedAt?: string;
      resolvedAt?: string;
      createdAt: string;
      updatedAt: string;
    }>> => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      return fetchJsonAuth(`/consultations?${params.toString()}`);
    },

    getConsultationById: (id: string): Promise<{
      _id: string;
      name: string;
      email?: string;
      mobile?: string;
      subject: string;
      message: string;
      status: 'pending' | 'read' | 'contacted' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high';
      assignedTo?: string;
      adminNotes?: string;
      contactedAt?: string;
      resolvedAt?: string;
      createdAt: string;
      updatedAt: string;
    }> => {
      return fetchJsonAuth(`/consultations/${id}`);
    },

    updateConsultationStatus: (id: string, status: 'pending' | 'read' | 'contacted' | 'resolved' | 'closed'): Promise<any> => {
      return fetchJsonAuth(`/consultations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    updateConsultation: (id: string, updates: {
      status?: 'pending' | 'read' | 'contacted' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high';
      assignedTo?: string;
      adminNotes?: string;
    }): Promise<any> => {
      return fetchJsonAuth(`/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    deleteConsultation: (id: string): Promise<{ success: boolean }> => {
      return fetchJsonAuth(`/consultations/${id}`, {
        method: 'DELETE',
      });
    },

    getStats: (): Promise<{
      total: number;
      pending: number;
      read: number;
      contacted: number;
      resolved: number;
      closed: number;
    }> => {
      return fetchJsonAuth('/consultations/stats');
    }
  },

  // Credit Management
  credits: {
    getTransactions: (filters: any = {}, page: number = 1, limit: number = 50): Promise<any> => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      return fetchJsonAuth(`/admin/credits/transactions?${params.toString()}`);
    },

    getReferrals: (filters: any = {}, page: number = 1, limit: number = 50): Promise<any> => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      return fetchJsonAuth(`/admin/credits/referrals?${params.toString()}`);
    },

    getStats: (): Promise<any> => {
      return fetchJsonAuth('/admin/credits/stats');
    },

    getSuspiciousReferrals: (): Promise<{ referrals: any[] }> => {
      return fetchJsonAuth('/admin/credits/suspicious-referrals');
    },

    adjustUserCredits: (userId: string, amount: number, reason: string): Promise<{ success: boolean; message: string }> => {
      return fetchJsonAuth('/admin/credits/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, amount, reason })
      });
    },

    getUserWallet: (userId: string): Promise<any> => {
      return fetchJsonAuth(`/admin/credits/wallet/${userId}`);
    }
  }
};

// Analytics API functions
export const analyticsApi = {
  // Track analytics event
  trackEvent: (event: AnalyticsEvent): Promise<{ success: boolean }> => {
    return fetchJson('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  },

  // Get analytics events
  getEvents: (filters: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    userId?: string;
    productId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ events: AnalyticsEvent[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return fetchJsonAuth<{ events: AnalyticsEvent[]; total: number }>(`/analytics/events?${params.toString()}`);
  },

  // Get sales analytics
  getSalesAnalytics: (startDate?: string, endDate?: string): Promise<SalesAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJsonAuth(`/analytics/sales?${params.toString()}`);
  },

  // Get traffic analytics
  getTrafficAnalytics: (startDate?: string, endDate?: string): Promise<TrafficAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJsonAuth(`/analytics/traffic?${params.toString()}`);
  },

  // Get real-time analytics
  getRealTimeAnalytics: (): Promise<RealTimeAnalytics> => {
    return fetchJsonAuth('/analytics/realtime');
  },

  // Get user behavior
  getUserBehavior: (userId: string): Promise<{
    userId: string;
    totalEvents: number;
    lastActive: string;
    topPages: Array<{ page: string; views: number }>;
    topProducts: Array<{ productId: string; views: number }>;
    conversionFunnel: {
      pageViews: number;
      addToCart: number;
      checkoutStart: number;
      purchase: number;
    };
  }> => {
    return fetchJsonAuth(`/analytics/user/${userId}`);
  },

  // Get dashboard analytics (combined)
  getDashboardAnalytics: (startDate?: string, endDate?: string): Promise<{
    sales: SalesAnalytics;
    traffic: TrafficAnalytics;
    summary: {
      totalRevenue: number;
      totalOrders: number;
      totalVisitors: number;
      conversionRate: number;
      averageOrderValue: number;
      bounceRate: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJsonAuth<{
      sales: SalesAnalytics;
      traffic: TrafficAnalytics;
      summary: {
        totalRevenue: number;
        totalOrders: number;
        totalVisitors: number;
        conversionRate: number;
        averageOrderValue: number;
        bounceRate: number;
      };
    }>(`/analytics/dashboard?${params.toString()}`);
  }
};


// OTP API
export const otpApi = {
  // Generate and send OTP
  generateOTP: (request: OTPRequest, sessionId: string): Promise<OTPResponse> => {
    return fetchJson('/otp/generate', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        sessionId
      })
    });
  },

  // Verify OTP
  verifyOTP: (verification: OTPVerification): Promise<OTPResponse> => {
    return fetchJson('/otp/verify', {
      method: 'POST',
      body: JSON.stringify(verification)
    });
  },

  // Check OTP status
  checkOTPStatus: (phone: string, sessionId: string, purpose: string): Promise<OTPStatus> => {
    const params = new URLSearchParams({ phone, sessionId, purpose });
    return fetchJson(`/otp/status?${params.toString()}`);
  }
};

// Blog API
export const blogApi = {
  // Get blog posts
  getPosts: (query: BlogQuery = {}): Promise<BlogPost[]> => {
    const searchParams = new URLSearchParams();
    
    if (query.page) searchParams.append('page', query.page.toString());
    if (query.limit) searchParams.append('limit', query.limit.toString());
    if (query.category) searchParams.append('category', query.category);
    if (query.tag) searchParams.append('tag', query.tag);
    if (query.search) searchParams.append('search', query.search);
    if (query.status) searchParams.append('status', query.status);
    if (query.featured !== undefined) searchParams.append('featured', query.featured.toString());
    if (query.sortBy) searchParams.append('sortBy', query.sortBy);
    
    const queryString = searchParams.toString();
    return fetchJson(`/blog/posts${queryString ? `?${queryString}` : ''}`);
  },

  // Get blog post by slug
  getPostBySlug: (slug: string): Promise<BlogPost> => {
    return fetchJson(`/blog/posts/slug/${slug}`);
  },

  // Get blog post by ID (admin)
  getPostById: (id: string): Promise<BlogPost> => {
    return fetchJsonAuth(`/blog/posts/${id}`);
  },

  // Create blog post (admin)
  createPost: (postData: Partial<BlogPost>): Promise<BlogPost> => {
    return fetchJsonAuth('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  // Update blog post (admin)
  updatePost: (id: string, postData: Partial<BlogPost>): Promise<BlogPost> => {
    return fetchJsonAuth(`/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  // Delete blog post (admin)
  deletePost: (id: string): Promise<{ success: boolean }> => {
    return fetchJsonAuth(`/blog/posts/${id}`, {
      method: 'DELETE'
    });
  },

  // Search blog posts
  searchPosts: (query: string, page = 1, limit = 10): Promise<BlogPost[]> => {
    const searchParams = new URLSearchParams({ q: query, page: page.toString(), limit: limit.toString() });
    return fetchJson(`/blog/posts/search?${searchParams.toString()}`);
  },

  // Get related blog posts
  getRelatedPosts: (slug: string, limit = 5): Promise<BlogPost[]> => {
    return fetchJson(`/blog/posts/${slug}/related?limit=${limit}`);
  },

  // Get blog categories
  getCategories: (): Promise<BlogCategory[]> => {
    return fetchJson('/blog/categories');
  },

  // Create blog category (admin)
  createCategory: (categoryData: Partial<BlogCategory>): Promise<BlogCategory> => {
    return fetchJsonAuth('/blog/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  // Update blog category (admin)
  updateCategory: (categoryId: string, categoryData: Partial<BlogCategory>): Promise<BlogCategory> => {
    return fetchJsonAuth(`/blog/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },

  // Delete blog category (admin)
  deleteCategory: (categoryId: string): Promise<{ success: boolean }> => {
    return fetchJsonAuth(`/blog/categories/${categoryId}`, {
      method: 'DELETE'
    });
  },

  // Get blog stats
  getStats: (): Promise<BlogStats> => {
    return fetchJson('/blog/stats');
  }
};

// Brand API
export const brandApi = {
  // Get all brands
  getBrands: (): Promise<Brand[]> => {
    return fetchJson('/brands');
  },

  // Get brand by ID
  getBrandById: (brandId: string): Promise<Brand> => {
    return fetchJson(`/brands/${brandId}`);
  },

  // Get brand by slug
  getBrandBySlug: (slug: string): Promise<Brand> => {
    return fetchJson(`/brands/slug/${slug}`);
  },

  // Get featured brands
  getFeaturedBrands: (limit?: number): Promise<Brand[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return fetchJson(`/brands/featured${params}`);
  },

  // Get brands by category
  getBrandsByCategory: (category: string): Promise<Brand[]> => {
    return fetchJson(`/brands/category/${category}`);
  },

  // Search brands
  searchBrands: (query: string, limit?: number): Promise<Brand[]> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    return fetchJson(`/brands/search?${params}`);
  },

  // Get brand tree
  getBrandTree: (): Promise<BrandTree[]> => {
    return fetchJson('/brands/tree');
  },

  // Get brand hierarchy
  getBrandHierarchy: (): Promise<BrandHierarchy> => {
    return fetchJson('/brands/hierarchy');
  },

  // Get brand stats
  getBrandStats: (): Promise<BrandStats> => {
    return fetchJson('/brands/stats');
  },

  // Create brand (admin only)
  createBrand: (brandData: Partial<Brand>): Promise<Brand> => {
    return fetchJsonAuth('/brands', {
      method: 'POST',
      body: JSON.stringify(brandData)
    });
  },

  // Update brand (admin only)
  updateBrand: (brandId: string, brandData: Partial<Brand>): Promise<Brand> => {
    return fetchJsonAuth(`/brands/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(brandData)
    });
  },

  // Delete brand (admin only)
  deleteBrand: (brandId: string): Promise<{ success: boolean }> => {
    return fetchJsonAuth(`/brands/${brandId}`, {
      method: 'DELETE'
    });
  },

  // Toggle brand status (admin only)
  toggleBrandStatus: (brandId: string): Promise<Brand> => {
    return fetchJsonAuth(`/brands/${brandId}/toggle-status`, {
      method: 'PATCH'
    });
  },

  // Toggle brand featured status (admin only)
  toggleBrandFeatured: (brandId: string): Promise<Brand> => {
    return fetchJsonAuth(`/brands/${brandId}/toggle-featured`, {
      method: 'PATCH'
    });
  },

  // Update brand product count (admin only)
  updateBrandProductCount: (brandId: string): Promise<{ success: boolean }> => {
    return fetchJsonAuth(`/brands/${brandId}/update-product-count`, {
      method: 'PATCH'
    });
  }
};

// Credit API functions
export const creditApi = {
  // Get credit balance
  getBalance: (): Promise<CreditBalance> => {
    return fetchJsonAuth('/credits/balance');
  },

  // Get credit wallet details
  getWallet: (): Promise<CreditWallet> => {
    return fetchJsonAuth('/credits/wallet');
  },

  // Get credit transactions with pagination
  getTransactions: (limit: number = 20, cursor?: string): Promise<{
    transactions: CreditTransaction[];
    hasMore: boolean;
    nextCursor?: string;
  }> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    return fetchJsonAuth(`/credits/transactions?${params}`);
  },

  // Get user's referral code
  getReferralCode: (): Promise<{ referralCode: string }> => {
    return fetchJsonAuth('/credits/referral-code');
  },

  // Get referral statistics
  getReferralStats: (): Promise<ReferralStats> => {
    return fetchJsonAuth('/credits/referrals/stats');
  },

  // Get user referrals list
  getReferrals: (limit: number = 20): Promise<{ referrals: Referral[] }> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    return fetchJsonAuth(`/credits/referrals?${params}`);
  },

  // Validate credit redemption before checkout
  validateRedemption: (creditsToRedeem: number, cartTotal: number): Promise<CreditRedemptionValidation> => {
    return fetchJsonAuth('/credits/validate-redemption', {
      method: 'POST',
      body: JSON.stringify({ creditsToRedeem, cartTotal })
    });
  }
};

// Periodic token refresh to prevent authentication timeouts
let tokenRefreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefreshScheduler(): void {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Check and refresh token every 10 minutes
  tokenRefreshInterval = setInterval(async () => {
    const token = localStorage.getItem('accessToken');
    if (token && isTokenExpired(token)) {
      if (isDevLogging) {
        devLog('🔄 Proactive token refresh triggered');
      }
      await refreshAccessToken();
    }
  }, 10 * 60 * 1000); // 10 minutes
}

export function stopTokenRefreshScheduler(): void {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

// Search API functions
export const searchApi = {
  // Search products with filters and pagination
  search: async (query: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
    filters?: {
      brand?: string[];
      category?: string[];
      priceMin?: number;
      priceMax?: number;
      inStock?: boolean;
      rating?: number;
    };
  } = {}): Promise<{
    products: Product[];
    total: number;
    suggestions?: string[];
    filters?: {
      brands: string[];
      categories: string[];
      priceRange: { min: number; max: number };
    };
  }> => {
    const params = new URLSearchParams({
      q: query,
      page: (options.page || 1).toString(),
      limit: (options.limit || 50).toString(),
      sortBy: options.sortBy || 'relevance'
    });
    
    // Add filters to params
    if (options.filters) {
      if (options.filters.brand && options.filters.brand.length > 0) {
        params.append('brand', options.filters.brand.join(','));
      }
      if (options.filters.category && options.filters.category.length > 0) {
        params.append('category', options.filters.category.join(','));
      }
      if (options.filters.priceMin !== undefined) {
        params.append('priceMin', options.filters.priceMin.toString());
      }
      if (options.filters.priceMax !== undefined) {
        params.append('priceMax', options.filters.priceMax.toString());
      }
      if (options.filters.inStock !== undefined) {
        params.append('inStock', options.filters.inStock.toString());
      }
      if (options.filters.rating !== undefined) {
        params.append('rating', options.filters.rating.toString());
      }
    }
    
    return fetchJson(`/catalog/search?${params.toString()}`, {
      next: { revalidate: 300 } // 5 min cache
    });
  },
  
  // Get search suggestions for autocomplete
  suggestions: async (query: string): Promise<{
    products: Array<{
      _id: string;
      title: string;
      slug: string;
      brand: string;
      price: { amount: number; currency: string };
      images: string[];
      rating?: { average: number; count: number };
    }>;
    brands: string[];
    categories: string[];
  }> => {
    if (query.length < 2) {
      return { products: [], brands: [], categories: [] };
    }
    
    return fetchJson(`/catalog/search/suggestions?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 60 } // 1 min cache
    });
  },
  
  // Get popular searches
  popularSearches: async (): Promise<string[]> => {
    return fetchJson('/catalog/search/popular', {
      next: { revalidate: 3600 } // 1 hour cache
    });
  }
};

// Auto-start the scheduler when the module loads
if (typeof window !== 'undefined') {
  startTokenRefreshScheduler();
}

const clearCategoryCaches = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Clear all category-related caches to ensure fresh data after admin changes
    sessionStorage.removeItem('cachedCategories');
    sessionStorage.removeItem('cachedHeaderCategories');
    sessionStorage.removeItem('cachedHomepageCategories'); // Homepage category showcase cache
  } catch (error) {
    console.warn('Failed to clear category cache storage', error);
  }

  import('swr')
    .then(({ mutate }) => {
      mutate('/categories');
    })
    .catch(() => {
      // SWR may not be available (e.g., during SSR); ignore errors
    });
};


