// Admin Dashboard Types

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  lowStockProducts: number;
  topSellingProducts: Array<{
    productId: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface AdminUser {
  _id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'staff' | 'monitor' | 'customer';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminProduct {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  categoryIds: string[];
  brand?: string;
  images: string[];
  price: {
    currency: string;
    amount: number;
    originalAmount?: number;
  };
  stock: number;
  variantStock?: Record<string, number>; // Stock per variant combination: "size_color" format
  sizes?: string[];
  colors?: string[];
  attributes?: Record<string, string | number | boolean | null>;
  homepageSection?: 'new-arrivals' | 'skincare-essentials' | 'makeup-collection' | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminOrderItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  variant: string | null;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface AdminOrderCustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AdminOrderAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'preorder' | 'confirmed' | 'processing' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod';
  customer: AdminOrderCustomer;
  items: AdminOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: AdminOrderAddress;
  billingAddress: AdminOrderAddress;
  notes?: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  isPreorder?: boolean;
  preorderPaymentAmount?: number;
  preorderRemainingAmount?: number;
  // For partial payments (outside Dhaka orders)
  advancePayment?: number;
  remainingBalance?: number;
  isPartialPayment?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserFilters extends AdminFilters {
  role?: 'admin' | 'staff' | 'monitor' | 'customer';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminProductFilters extends AdminFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  lowStock?: boolean;
}

export interface AdminOrderFilters extends AdminFilters {
  status?: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'refunded';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SalesAnalytics {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
  topCustomers: Array<{
    userId: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  paymentGateways: {
    stripe?: {
      enabled: boolean;
      publicKey?: string;
      secretKey?: string;
    };
    paypal?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
  };
  shippingZones: Array<{
    name: string;
    areas: string[];
    cost: number;
    freeShippingThreshold?: number;
  }>;
}

export interface AdminActivityLog {
  _id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;
  changes?: {
    before?: any;
    after?: any;
    field?: string;
  };
  timestamp: string;
  ip: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

export interface AdminActivityLogFilters {
  userId?: string;
  userEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  ip?: string;
}

export interface AdminActivityStats {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  byResourceType: Array<{ resourceType: string; count: number }>;
  byUser: Array<{ userId: string; userEmail: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

// Navigation Types
export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: AdminNavItem[];
  /** If true, monitor role can see this item (view-only access) */
  monitorAllowed?: boolean;
}

// Enhanced Product interface
export interface ExtendedAdminProduct extends AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  comparePrice?: number;
  cost: number;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  variants: Array<{
    id?: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
  }>;
  trackInventory: boolean;
  status: 'active' | 'draft' | 'archived';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  salesCount: number;
  viewCount: number;
}

