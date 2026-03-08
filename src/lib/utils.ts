import { 
  Product, 
  Category, 
  User, 
  Order, 
  Cart,
  ProductPrice,
  OrderStatus,
  PaymentStatus,
  LoadingState,
  ValidationError,
  AppError
} from './types';

// Class name utility function (similar to clsx)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Type Guards
export const typeGuards = {
  // Check if value is a valid Product
  isProduct: (value: unknown): value is Product => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Product)._id === 'string' &&
      typeof (value as Product).title === 'string' &&
      typeof (value as Product).slug === 'string' &&
      Array.isArray((value as Product).images) &&
      typeof (value as Product).price === 'object' &&
      typeof (value as Product).price.amount === 'number' &&
      typeof (value as Product).price.currency === 'string'
    );
  },

  // Check if value is a valid Category
  isCategory: (value: unknown): value is Category => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Category).name === 'string' &&
      typeof (value as Category).slug === 'string'
    );
  },

  // Check if value is a valid User
  isUser: (value: unknown): value is User => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as User)._id === 'string' &&
      typeof (value as User).email === 'string' &&
      ['admin', 'staff', 'monitor', 'customer'].includes((value as User).role)
    );
  },

  // Check if value is a valid Order
  isOrder: (value: unknown): value is Order => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Order)._id === 'string' &&
      typeof (value as Order).orderNumber === 'string' &&
      Array.isArray((value as Order).items) &&
      typeof (value as Order).total === 'number'
    );
  },

  // Check if value is a valid Cart
  isCart: (value: unknown): value is Cart => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Cart)._id === 'string' &&
      typeof (value as Cart).userId === 'string' &&
      Array.isArray((value as Cart).items)
    );
  },

  // Check if value is a valid email
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // Check if value is a valid phone number
  isPhoneNumber: (value: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value);
  },

  // Check if value is a valid URL
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // Check if value is a valid slug
  isSlug: (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  },
};

// Validation Functions
export const validators = {
  // Validate required field
  required: (value: unknown, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED',
      };
    }
    return null;
  },

  // Validate email
  email: (value: string, fieldName: string = 'email'): ValidationError | null => {
    if (!typeGuards.isEmail(value)) {
      return {
        field: fieldName,
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
      };
    }
    return null;
  },

  // Validate password strength
  password: (value: string, fieldName: string = 'password'): ValidationError | null => {
    if (value.length < 8) {
      return {
        field: fieldName,
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT',
      };
    }
    
    if (!/(?=.*[a-z])/.test(value)) {
      return {
        field: fieldName,
        message: 'Password must contain at least one lowercase letter',
        code: 'PASSWORD_MISSING_LOWERCASE',
      };
    }
    
    if (!/(?=.*[A-Z])/.test(value)) {
      return {
        field: fieldName,
        message: 'Password must contain at least one uppercase letter',
        code: 'PASSWORD_MISSING_UPPERCASE',
      };
    }
    
    if (!/(?=.*\d)/.test(value)) {
      return {
        field: fieldName,
        message: 'Password must contain at least one number',
        code: 'PASSWORD_MISSING_NUMBER',
      };
    }
    
    return null;
  },

  // Validate phone number
  phone: (value: string, fieldName: string = 'phone'): ValidationError | null => {
    if (!typeGuards.isPhoneNumber(value)) {
      return {
        field: fieldName,
        message: 'Please enter a valid phone number',
        code: 'INVALID_PHONE',
      };
    }
    return null;
  },

  // Validate minimum length
  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
        code: 'MIN_LENGTH',
      };
    }
    return null;
  },

  // Validate maximum length
  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (value.length > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${max} characters long`,
        code: 'MAX_LENGTH',
      };
    }
    return null;
  },

  // Validate number range
  numberRange: (value: number, min: number, max: number, fieldName: string): ValidationError | null => {
    if (value < min || value > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
        code: 'NUMBER_OUT_OF_RANGE',
      };
    }
    return null;
  },

  // Validate credit card number (basic Luhn algorithm)
  creditCard: (value: string, fieldName: string = 'cardNumber'): ValidationError | null => {
    const cleanValue = value.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanValue)) {
      return {
        field: fieldName,
        message: 'Please enter a valid credit card number',
        code: 'INVALID_CARD_NUMBER',
      };
    }

    // Luhn algorithm
    let sum = 0;
    let alternate = false;
    
    for (let i = cleanValue.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanValue.charAt(i), 10);
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    if (sum % 10 !== 0) {
      return {
        field: fieldName,
        message: 'Please enter a valid credit card number',
        code: 'INVALID_CARD_NUMBER',
      };
    }
    
    return null;
  },

  // Validate expiry date (MM/YY format)
  expiryDate: (value: string, fieldName: string = 'expiryDate'): ValidationError | null => {
    if (!/^\d{2}\/\d{2}$/.test(value)) {
      return {
        field: fieldName,
        message: 'Please enter expiry date in MM/YY format',
        code: 'INVALID_EXPIRY_FORMAT',
      };
    }

    const [month, year] = value.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) {
      return {
        field: fieldName,
        message: 'Please enter a valid month (01-12)',
        code: 'INVALID_MONTH',
      };
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return {
        field: fieldName,
        message: 'Card has expired',
        code: 'CARD_EXPIRED',
      };
    }

    return null;
  },

  // Validate CVV
  cvv: (value: string, fieldName: string = 'cvv'): ValidationError | null => {
    if (!/^\d{3,4}$/.test(value)) {
      return {
        field: fieldName,
        message: 'Please enter a valid CVV (3-4 digits)',
        code: 'INVALID_CVV',
      };
    }
    return null;
  },
};

// Utility Functions
export const formatters = {
  // Format price with currency
  formatPrice: (price: ProductPrice | number, currency: string = 'USD'): string => {
    const amount = typeof price === 'number' ? price : price.amount;
    const currencyCode = typeof price === 'number' ? currency : price.currency;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  },

  // Format date
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatters.formatDate(dateObj);
  },

  // Format phone number
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  },

  // Format credit card number with spaces
  formatCreditCard: (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format order status for display
  formatOrderStatus: (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    
    return statusMap[status] || status;
  },

  // Format payment status for display
  formatPaymentStatus: (status: PaymentStatus): string => {
    const statusMap: Record<PaymentStatus, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
    };
    
    return statusMap[status] || status;
  },
};

// Array and Object Utilities
export const arrayUtils = {
  // Remove duplicates from array
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },

  // Group array by key
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  // Sort array by multiple criteria
  sortBy: <T>(array: T[], ...criteria: Array<(item: T) => any>): T[] => {
    return array.sort((a, b) => {
      for (const criterion of criteria) {
        const aVal = criterion(a);
        const bVal = criterion(b);
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

// String Utilities
export const stringUtils = {
  // Convert to slug
  toSlug: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Truncate text with ellipsis
  truncate: (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
  },

  // Generate random string
  generateId: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Local Storage Utilities
export const storageUtils = {
  // Set item with expiration
  setItem: (key: string, value: any, expirationHours?: number): void => {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationHours ? Date.now() + (expirationHours * 60 * 60 * 1000) : null,
    };
    
    localStorage.setItem(key, JSON.stringify(item));
  },

  // Get item with expiration check
  getItem: <T = any>(key: string): T | null => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch {
      return null;
    }
  },

  // Remove item
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  // Clear all items
  clear: (): void => {
    localStorage.clear();
  },
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Error handling utilities
export const errorUtils = {
  // Create standardized error
  createError: (message: string, code?: string, field?: string): AppError => ({
    message,
    code,
    field,
  }),

  // Format error for display
  formatError: (error: AppError | Error | string): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return error.message;
  },

  // Check if error is specific type
  isValidationError: (error: unknown): error is ValidationError => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'field' in error &&
      'message' in error
    );
  },
};
