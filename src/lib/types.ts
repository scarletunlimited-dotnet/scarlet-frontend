// Base Entity Types
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// Product Related Types
export interface Category extends Partial<BaseEntity> {
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  image?: string;
  isActive?: boolean;
  showInHomepage?: boolean;
  sortOrder?: number;
  icon?: string;
  // Hierarchy support
  level?: number;
  path?: string; // e.g., "skincare/face-care/cleansers"
  childrenCount?: number;
  hasChildren?: boolean;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface CategoryHierarchy {
  rootCategories: CategoryTree[];
  allCategories: Category[];
  maxLevel: number;
}

// Blog Types
export interface BlogAuthor {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface BlogCategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPost extends Partial<BaseEntity> {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: BlogAuthor;
  categories: string[]; // Array of category IDs
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  readingTime: number; // in minutes
  viewCount: number;
  isFeatured?: boolean;
  isPinned?: boolean;
}

export interface BlogQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'title';
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalCategories: number;
  mostPopularPost?: {
    title: string;
    slug: string;
    viewCount: number;
  };
  recentPosts: BlogPost[];
}

// Brand Types
export interface Brand {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  website?: string;
  establishedYear?: number;
  origin?: string;
  category: string;
  specialties?: string[];
  about?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  productCount: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface BrandTree extends Brand {
  children?: BrandTree[];
  hasChildren?: boolean;
  childrenCount?: number;
  level?: number;
  path?: string[];
}

export interface BrandHierarchy {
  rootBrands: BrandTree[];
  allBrands: Brand[];
  maxLevel: number;
}

// Credit System Types
export interface CreditWallet {
  _id?: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditTransaction {
  _id?: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'refunded' | 'adjusted';
  amount: number;
  source: 'signup' | 'referral' | 'order' | 'manual' | 'refund';
  referenceId?: string;
  referenceType?: 'order' | 'referral' | 'signup' | 'manual';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Referral {
  _id?: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'rejected';
  creditsAwarded: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  creditsEarned: number;
  monthlyReferrals: number;
  monthlyLimit: number;
  canReferMore: boolean;
}

export interface CreditRedemptionValidation {
  valid: boolean;
  availableCredits: number;
  maxRedeemable: number;
  discountAmount: number;
  minCartValue: number;
  errors?: string[];
}

export interface CreditBalance {
  balance: number;
  value: number; // BDT value (balance / 10)
}

export interface BrandStats {
  totalBrands: number;
  activeBrands: number;
  featuredBrands: number;
  totalProducts: number;
  categories: string[];
}

export interface ProductPrice {
  currency: string;
  amount: number;
  originalAmount?: number; // For sale prices
  discountPercentage?: number;
}

export interface ProductAttribute {
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
  displayName?: string;
}

export interface Product extends BaseEntity {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  price: ProductPrice;
  brand?: string;
  stock?: number;
  variantStock?: Record<string, number>; // Stock per variant combination: "size_color" format
  variantImages?: Record<string, string[]>; // Images per variant combination: "size_color" format (e.g., "Large_Red" -> ["image1.jpg", "image2.jpg"])
  categoryIds: string[];
  attributes?: ProductAttribute[];
  tags?: string[];
  sku?: string;
  sizes?: string[];
  colors?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  isActive?: boolean;
  isFeatured?: boolean;
  homepageSection?: 'new-arrivals' | 'skincare-essentials' | 'makeup-collection' | 'coming-soon' | null;
  isComingSoon?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

// User Related Types
export type UserRole = 'admin' | 'staff' | 'monitor' | 'customer';

export interface User extends BaseEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isEmailVerified?: boolean;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: {
    newsletter: boolean;
    smsNotifications: boolean;
    language: string;
    currency: string;
  };
}

// Cart Related Types
export interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  addedAt?: string;
  // Populated product data
  product?: Product;
}

export interface Cart extends BaseEntity {
  userId: string;
  items: CartItem[];
  sessionId?: string; // For guest carts
  expiresAt?: string;
}

// Order Related Types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod' | 'sslcommerz' | 'paypal' | 'apple_pay' | 'google_pay';

export interface OrderItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  brand?: string;
  sku?: string;
  size?: string;
  color?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface Address extends BaseEntity {
  userId: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface CreateAddressData {
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface WishlistItem extends BaseEntity {
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
  isOutOfStock?: boolean;
  notifyWhenInStock?: boolean;
  notificationSent?: boolean;
  priority?: 'low' | 'medium' | 'high';
  customerNotes?: string;
  estimatedRestockDate?: string;
}

export interface OutOfStockWishlistItem extends WishlistItem {
  isOutOfStock: true;
  notifyWhenInStock: true;
  customer: {
    _id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  product: Product & {
    stock: 0;
    stockStatus: 'out_of_stock';
  };
}

export interface WishlistAnalytics {
  totalWishlistItems: number;
  outOfStockItems: number;
  inStockItems: number;
  mostWishedProducts: Array<{
    productId: string;
    productName: string;
    wishlistCount: number;
    isOutOfStock: boolean;
  }>;
  recentWishlistActivity: Array<{
    userId: string;
    productId: string;
    action: 'added' | 'removed';
    timestamp: string;
  }>;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  last4?: string; // Last 4 digits of card
  brand?: string; // Card brand (visa, mastercard, etc.)
}

export interface Order extends BaseEntity {
  orderNumber: string;
  userId?: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentInfo: PaymentInfo;
  shippingMethod: string;
  deliveredAt?: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    field?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Filter and Sort Types
export interface ProductFilters {
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  search?: string;
}

export type ProductSortOption = 'featured' | 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'popularity';

export interface ProductQuery extends ProductFilters {
  page?: number;
  limit?: number;
  sort?: ProductSortOption;
}

// Form Types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterFormData {
  email: string;
  firstName?: string;
  preferences?: string[];
}


// Authentication Types
export interface LoginFormData {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  referralCode?: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}

// Checkout Types
export interface CheckoutFormData {
  // Contact
  email: string;
  
  // Shipping
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  shippingMethod: string;
  
  // Payment
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardName?: string;
  
  // Options
  saveAddress?: boolean;
  sameAsBilling?: boolean;
  newsletter?: boolean;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  details?: any;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component Props Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme and UI Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Search and Navigation Types
export interface SearchResult {
  products: Product[];
  categories: Category[];
  total: number;
  query: string;
  suggestions?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
}

// Analytics and Tracking Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
}

export interface ProductViewEvent extends AnalyticsEvent {
  name: 'product_view';
  properties: {
    productId: string;
    productName: string;
    category: string;
    price: number;
    currency: string;
  };
}

export interface AddToCartEvent extends AnalyticsEvent {
  name: 'add_to_cart';
  properties: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    currency: string;
  };
}

export interface PurchaseEvent extends AnalyticsEvent {
  name: 'purchase';
  properties: {
    orderId: string;
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  };
}


